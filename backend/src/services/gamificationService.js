const pool = require("../config/db");
const { gamificationRepository } = require("../repositories/gamificationRepository");
const { computeStreakStats, streakMessage, toDateStr } = require("../utils/streak");
const { createId } = require("../utils/ids");
const {
  CATEGORY_PROFILES,
  calculateCalories,
  calculateMet,
  calculateXP,
  getCategorySlug,
  getDistanceKm,
  getDurationMinutes,
  resolveCategoryProfile
} = require("../utils/calculators");

const CHECKIN_XP = 10;
const DEFAULT_LEVEL = { levelNumber: 1, xpRequired: 0, badgeUnlock: "level_1", title: "Starter" };

/**
 * Creates a controller-friendly HTTP error.
 * @param {string} message Human-readable message.
 * @param {number} status HTTP status code.
 * @returns {Error}
 */
function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Converts a DB level row into the public level shape.
 * @param {object} row Level row.
 * @returns {{levelNumber: number, xpRequired: number, badgeUnlock: string|null, title: string}}
 */
function mapLevel(row = {}) {
  return {
    levelNumber: Number(row.level_number || row.levelNumber || DEFAULT_LEVEL.levelNumber),
    xpRequired: Number(row.xp_required || row.xpRequired || DEFAULT_LEVEL.xpRequired),
    badgeUnlock: row.badge_unlock || row.badgeUnlock || null,
    title: row.title || DEFAULT_LEVEL.title
  };
}

/**
 * Loads the level a total XP value currently qualifies for.
 * @param {number} totalXp Current total XP.
 * @param {object} executor Pool or transaction connection.
 * @returns {Promise<object>}
 */
async function getCurrentLevel(totalXp, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT level_number, xp_required, badge_unlock, title
     FROM levels
     WHERE xp_required <= ?
     ORDER BY xp_required DESC
     LIMIT 1`,
    [Number(totalXp || 0)]
  );
  return mapLevel(rows[0] || DEFAULT_LEVEL);
}

/**
 * Loads the next level after the user's current level.
 * @param {number} levelNumber Current level number.
 * @param {object} executor Pool or transaction connection.
 * @returns {Promise<object|null>}
 */
async function getNextLevel(levelNumber, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT level_number, xp_required, badge_unlock, title
     FROM levels
     WHERE level_number > ?
     ORDER BY level_number ASC
     LIMIT 1`,
    [Number(levelNumber || 1)]
  );
  return rows[0] ? mapLevel(rows[0]) : null;
}

/**
 * Loads category metadata by slug or category id.
 * @param {string} category Category slug or id.
 * @param {object} executor Pool or transaction connection.
 * @returns {Promise<object|null>}
 */
async function getCategoryMeta(category, executor = pool) {
  const slug = String(category || "").trim().toLowerCase();
  if (!slug) return null;

  const [rows] = await executor.execute(
    `SELECT id, name, slug, base_met, xp_per_met_min, description
     FROM exercise_categories
     WHERE slug = ? OR id = ? OR LOWER(name) = ?
     LIMIT 1`,
    [slug, slug, slug]
  );

  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    name: rows[0].name,
    slug: rows[0].slug,
    baseMet: Number(rows[0].base_met),
    xpPerMetMin: Number(rows[0].xp_per_met_min),
    description: rows[0].description
  };
}

/**
 * Ensures badge rows exist before level awards reference them.
 * @param {string|null} code Badge code.
 * @param {string} title Level title.
 * @param {object} executor Transaction connection.
 * @returns {Promise<void>}
 */
async function ensureBadge(code, title, executor) {
  if (!code) return;
  await executor.execute(
    `INSERT IGNORE INTO achievements (code, name, description, requirement_type, requirement_value, sort_order)
     VALUES (?, ?, ?, 'level', 0, 100)`,
    [code, title, `Reached ${title}.`]
  );
}

/**
 * Awards a badge to a user if it is not already unlocked.
 * @param {string} userId User id.
 * @param {string|null} code Badge code.
 * @param {object} executor Transaction connection.
 * @returns {Promise<boolean>}
 */
async function awardBadge(userId, code, executor) {
  if (!code) return false;
  const [result] = await executor.execute(
    `INSERT IGNORE INTO user_achievements (id, user_id, achievement_code)
     VALUES (?, ?, ?)`,
    [createId("ach"), userId, code]
  );
  return result.affectedRows > 0;
}

/**
 * Applies XP to users, mirrors legacy gamification state, and awards level badge.
 * @param {string} userId User id.
 * @param {number} xpAmount XP to add.
 * @param {object} executor Transaction connection.
 * @returns {Promise<object>}
 */
async function addUserXp(userId, xpAmount, executor) {
  await executor.execute("UPDATE users SET total_xp = COALESCE(total_xp, 0) + ? WHERE id = ?", [
    xpAmount,
    userId
  ]);

  const [userRows] = await executor.execute("SELECT COALESCE(total_xp, 0) AS total_xp FROM users WHERE id = ?", [
    userId
  ]);
  const totalXp = Number(userRows[0]?.total_xp || 0);
  const level = await getCurrentLevel(totalXp, executor);
  const nextLevel = await getNextLevel(level.levelNumber, executor);

  await ensureBadge(level.badgeUnlock, level.title, executor);
  const badgeAwarded = await awardBadge(userId, level.badgeUnlock, executor);

  await executor.execute(
    `INSERT INTO user_gamification (user_id, total_xp, level, next_level_xp)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       total_xp = VALUES(total_xp),
       level = VALUES(level),
       next_level_xp = VALUES(next_level_xp)`,
    [userId, totalXp, level.levelNumber, nextLevel?.xpRequired || totalXp]
  );

  return {
    totalXp,
    total_xp: totalXp,
    level: level.levelNumber,
    title: level.title,
    nextLevelXp: nextLevel?.xpRequired || totalXp,
    next_level_xp: nextLevel?.xpRequired || totalXp,
    badgeUnlock: level.badgeUnlock,
    badgeAwarded
  };
}

/**
 * Builds the authenticated user's gamification summary.
 * @param {string} userId User id.
 * @returns {Promise<object>}
 */
async function buildSummary(userId) {
  const activeDates = await gamificationRepository.getActivityDates(userId);
  const stats = computeStreakStats(activeDates);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekly = await gamificationRepository.getWeeklyWorkoutTotals(userId, toDateStr(sevenDaysAgo));

  await gamificationRepository.upsertStreak(
    userId,
    stats.currentStreak,
    stats.longestStreak,
    stats.lastActiveDate
  );

  const [[userRow]] = await pool.execute("SELECT COALESCE(total_xp, 0) AS total_xp FROM users WHERE id = ?", [
    userId
  ]);
  const totalXp = Number(userRow?.total_xp || 0);
  const level = await getCurrentLevel(totalXp);
  const nextLevel = await getNextLevel(level.levelNumber);
  const catalog = await gamificationRepository.getAchievementCatalog();
  const unlocked = await gamificationRepository.getUnlockedAchievements(userId);

  return {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    weeklyConsistency: stats.weeklyConsistency,
    activeDaysInLast7: stats.activeDaysInLast7,
    lastActiveDate: stats.lastActiveDate,
    totalWorkoutsThisWeek: weekly.workoutCount,
    totalMinutesThisWeek: weekly.totalMinutes,
    totalCaloriesThisWeek: weekly.totalCalories,
    totalXp,
    total_xp: totalXp,
    level: level.levelNumber,
    title: level.title,
    nextLevelXp: nextLevel?.xpRequired || totalXp,
    next_level_xp: nextLevel?.xpRequired || totalXp,
    streakMessage: streakMessage(stats.currentStreak),
    badges: catalog.map((achievement) => ({
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      requirement: achievement.requirementType,
      value: achievement.requirementValue,
      isUnlocked: unlocked.has(achievement.code),
      unlockedAt: unlocked.get(achievement.code) || null
    })),
    newlyUnlocked: []
  };
}

/**
 * Records a server-calculated workout from the compact logging payload.
 * @param {string} userId User id.
 * @param {object} payload Request body.
 * @returns {Promise<object>}
 */
async function recordAutoWorkout(userId, payload) {
  const categoryMeta = await getCategoryMeta(getCategorySlug(payload));
  if (!categoryMeta) throw httpError("Choose a supported workout category.", 400);

  const durationMin = getDurationMinutes(payload);
  if (durationMin <= 0) throw httpError("Duration must be greater than zero.", 400);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [userRows] = await connection.execute("SELECT weight, weight_kg FROM users WHERE id = ? LIMIT 1", [userId]);
    if (!userRows[0]) throw httpError("User not found.", 404);

    const weightKg = Number(userRows[0].weight_kg || userRows[0].weight || 70);
    const workout = { ...payload, category: categoryMeta.slug, duration_min: durationMin };
    const profile = resolveCategoryProfile(categoryMeta.slug, categoryMeta);
    const met = calculateMet(categoryMeta.slug, getDistanceKm(payload), durationMin, profile.baseMet);
    const calories = calculateCalories(workout, weightKg, { categoryMeta, met });
    const xp = calculateXP(workout, { categoryMeta, met });
    const date = payload.date || toDateStr(new Date());
    const workoutId = createId("wk");
    const title = payload.title || categoryMeta.name;

    await connection.execute(
      `INSERT INTO workouts (
         id, user_id, date, title, duration_total, calories_total, calories_burned,
         calories, xp, intensity, calories_source, user_weight_at_log, notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'auto', ?, ?)`,
      [
        workoutId,
        userId,
        date,
        title,
        durationMin,
        calories,
        calories,
        calories,
        xp,
        payload.intensity || "med",
        weightKg,
        payload.notes || null
      ]
    );

    await connection.execute(
      `INSERT INTO workout_exercises (
         id, workout_id, category_id, category_name, exercise_name, duration, calories_burned
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [createId("ex"), workoutId, categoryMeta.id, categoryMeta.name, title, durationMin, calories]
    );

    const reward = await addUserXp(userId, xp, connection);
    await connection.execute(
      `INSERT INTO xp_logs (id, user_id, workout_id, xp_earned, reason, breakdown)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        createId("xp"),
        userId,
        workoutId,
        xp,
        `${categoryMeta.name} workout`,
        JSON.stringify({ category: categoryMeta.slug, duration_min: durationMin, calories, met })
      ]
    );

    await connection.commit();
    return {
      id: workoutId,
      xp_earned: xp,
      calories_burned: calories,
      new_total_xp: reward.totalXp,
      level: reward.level,
      title: reward.title,
      next_level_xp: reward.next_level_xp,
      badge_awarded: reward.badgeAwarded
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

const gamificationService = {
  CATEGORY_MET_DATA: CATEGORY_PROFILES,
  calculateCalories,
  calculateXP,
  getCategoryMeta,
  recordAutoWorkout,
  addUserXp,

  async getSummary(userId) {
    return buildSummary(userId);
  },

  async recordCheckin(userId, type) {
    const today = toDateStr(new Date());
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const created = await gamificationRepository.addCheckin(userId, today, type || "Wellness check-in", connection);
      let reward = null;
      if (created) {
        reward = await addUserXp(userId, CHECKIN_XP, connection);
        await connection.execute(
          `INSERT INTO xp_logs (id, user_id, xp_earned, reason, breakdown)
           VALUES (?, ?, ?, ?, ?)`,
          [createId("xp"), userId, CHECKIN_XP, "Daily check-in", JSON.stringify({ type })]
        );
      }
      await connection.commit();
      const summary = await buildSummary(userId);
      return { ...summary, checkinCreated: created, alreadyCheckedIn: !created, xpEarned: created ? CHECKIN_XP : 0, reward };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async getStatistics() {
    return gamificationRepository.getStreakStatistics();
  }
};

module.exports = {
  gamificationService,
  calculateXP,
  calculateCalories,
  CATEGORY_MET_DATA: CATEGORY_PROFILES
};

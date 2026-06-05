const pool = require("../config/db");
const { gamificationRepository } = require("../repositories/gamificationRepository");
const { computeStreakStats, streakMessage, toDateStr } = require("../utils/streak");
const { createId } = require("../utils/ids");

const CATEGORY_MET_DATA = {
  running: { name: "Running", baseMet: 9.8, xpPerMetMin: 0.18, type: "cardio" },
  cycling: { name: "Cycling", baseMet: 7.5, xpPerMetMin: 0.18, type: "cardio" },
  walking: { name: "Walking", baseMet: 3.5, xpPerMetMin: 0.2, type: "cardio" },
  swimming: { name: "Swimming", baseMet: 8.0, xpPerMetMin: 0.18, type: "cardio" },
  chest: { name: "Chest", baseMet: 6.0, xpPerMetMin: 0.2, type: "strength" },
  back: { name: "Back", baseMet: 6.0, xpPerMetMin: 0.2, type: "strength" },
  legs: { name: "Legs", baseMet: 6.5, xpPerMetMin: 0.2, type: "strength" },
  core: { name: "Core", baseMet: 3.8, xpPerMetMin: 0.22, type: "time" },
  "yoga-hatha": { name: "Yoga Hatha", baseMet: 2.5, xpPerMetMin: 0.25, type: "time" },
  "yoga-vinyasa": { name: "Yoga Vinyasa", baseMet: 4.0, xpPerMetMin: 0.25, type: "time" }
};

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeCategorySlug(workout = {}) {
  return String(workout.category || workout.categorySlug || workout.slug || "")
    .trim()
    .toLowerCase();
}

function getStaticCategory(slug) {
  return CATEGORY_MET_DATA[slug] || null;
}

async function getCategoryMeta(slug, executor = pool) {
  const fallback = getStaticCategory(slug);
  const [rows] = await executor.execute(
    `SELECT name, slug, base_met, xp_per_met_min
     FROM exercise_categories
     WHERE slug = ? OR LOWER(name) = ?
     LIMIT 1`,
    [slug, slug]
  );

  if (!rows[0]) return fallback;

  return {
    name: rows[0].name,
    baseMet: Number(rows[0].base_met) || fallback?.baseMet || 3.5,
    xpPerMetMin: Number(rows[0].xp_per_met_min) || fallback?.xpPerMetMin || 0.2,
    type: fallback?.type || "time"
  };
}

function cardioMet(slug, distanceKm, durationMin) {
  const speed = durationMin > 0 ? distanceKm / (durationMin / 60) : 0;

  if (slug === "running") {
    if (speed >= 14) return 12.51;
    if (speed >= 12) return 11;
    if (speed >= 10) return 10;
    if (speed >= 8) return 8.29;
    return 7;
  }

  if (slug === "cycling") {
    if (speed >= 25) return 12;
    if (speed >= 20) return 8;
    if (speed > 15) return 6;
    if (speed >= 10) return 4;
    return 3.5;
  }

  if (slug === "walking") {
    if (speed >= 6.5) return 5;
    if (speed >= 5) return 3.8;
    return 3.5;
  }

  return getStaticCategory(slug)?.baseMet || 3.5;
}

function getWorkoutMet(workout, categoryMeta = null) {
  const slug = normalizeCategorySlug(workout);
  const distanceKm = Number(workout.distance_km ?? workout.distanceKm ?? 0);
  const durationMin = Number(workout.duration_min ?? workout.durationMin ?? workout.duration ?? 0);

  if (distanceKm > 0) {
    return cardioMet(slug, distanceKm, durationMin);
  }

  return Number(categoryMeta?.baseMet || getStaticCategory(slug)?.baseMet || 3.5);
}

function strengthVolume(exercises = []) {
  return exercises.reduce(
    (total, exercise) =>
      total +
      (exercise.sets || []).reduce(
        (setTotal, set) =>
          setTotal +
          Number(set.sets || 1) * Number(set.reps || 0) * Number(set.weight || set.weightKg || 0),
        0
      ),
    0
  );
}

async function getStreakMultiplier(userId, executor = pool) {
  if (!userId) return 1;
  const [rows] = await executor.execute(
    "SELECT current_streak FROM user_gamification WHERE user_id = ? LIMIT 1",
    [userId]
  );
  const streak = Number(rows[0]?.current_streak || 0);
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1;
}

async function calculateXP(workout, userId, options = {}) {
  const slug = normalizeCategorySlug(workout);
  const categoryMeta =
    options.categoryMeta || (!userId && !options.executor ? getStaticCategory(slug) : await getCategoryMeta(slug, options.executor || pool));
  const durationMin = Number(workout.duration_min ?? workout.durationMin ?? workout.duration ?? 0);
  const distanceKm = Number(workout.distance_km ?? workout.distanceKm ?? 0);
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  const met = getWorkoutMet(workout, categoryMeta);

  let baseXp = 0;
  if (distanceKm > 0) {
    baseXp = Math.floor(distanceKm * met * 0.8);
  } else if (exercises.length > 0 && ["chest", "back", "legs"].includes(slug)) {
    baseXp = Math.floor(10 + strengthVolume(exercises) / 150);
  } else {
    baseXp = Math.floor(durationMin * met * (categoryMeta?.xpPerMetMin || 0.2));
  }

  const multiplier = options.multiplier || (await getStreakMultiplier(userId, options.executor || pool));
  return Math.floor(baseXp * multiplier);
}

function calculateCalories(workout, weightKg, options = {}) {
  const met = options.met || getWorkoutMet(workout, options.categoryMeta);
  const durationMin = Number(workout.duration_min ?? workout.durationMin ?? workout.duration ?? 0);
  return Math.round(met * Number(weightKg || 70) * (durationMin / 60));
}

function levelFromXp(totalXp) {
  const level = Math.floor(Number(totalXp || 0) / 500) + 1;
  return { level, nextLevelXp: level * 500 };
}

function daysBetween(previousDate, nextDate) {
  if (!previousDate) return null;
  const previous = new Date(`${toDateStr(previousDate)}T00:00:00Z`);
  const next = new Date(`${toDateStr(nextDate)}T00:00:00Z`);
  return Math.round((next - previous) / 86400000);
}

function weekKey(date = new Date()) {
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const day = Math.floor((date - yearStart) / 86400000) + 1;
  return `${date.getUTCFullYear()}-${Math.ceil(day / 7)}`;
}

function nextStreakState(row, workoutDate) {
  const currentStreak = Number(row?.current_streak || 0);
  const longestStreak = Number(row?.longest_streak || 0);
  const currentWeekKey = weekKey(new Date(`${workoutDate}T00:00:00Z`));
  let weeklyFreezesUsed = row?.last_freeze_week === currentWeekKey ? Number(row.weekly_freezes_used || 0) : 0;
  const gap = daysBetween(row?.last_active_date, workoutDate);
  let nextStreak = currentStreak;

  if (gap === 0) {
    nextStreak = currentStreak || 1;
  } else if (gap === 1 || gap === null) {
    nextStreak = currentStreak + 1;
  } else if (gap === 2 && weeklyFreezesUsed < 1) {
    weeklyFreezesUsed += 1;
    nextStreak = currentStreak + 1;
  } else {
    nextStreak = 1;
  }

  return {
    currentStreak: nextStreak,
    longestStreak: Math.max(longestStreak, nextStreak),
    weeklyFreezesUsed,
    lastFreezeWeek: currentWeekKey
  };
}

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

  const catalog = await gamificationRepository.getAchievementCatalog();
  const unlocked = await gamificationRepository.getUnlockedAchievements(userId);

  const newlyUnlocked = [];
  for (const achievement of catalog) {
    const qualifies =
      achievement.requirementType === "streak" && stats.longestStreak >= achievement.requirementValue;
    if (qualifies && !unlocked.has(achievement.code)) {
      const inserted = await gamificationRepository.unlockAchievement(userId, achievement.code);
      if (inserted) newlyUnlocked.push(achievement);
    }
  }

  const [gameRows] = await pool.execute(
    "SELECT total_xp, level, next_level_xp, current_streak FROM user_gamification WHERE user_id = ?",
    [userId]
  );
  const game = gameRows[0] || {};
  const levelData = levelFromXp(game.total_xp || 0);

  const badges = catalog.map((achievement) => ({
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    requirement: `${achievement.requirementValue}-Day Streak`,
    value: achievement.requirementValue,
    isUnlocked: stats.longestStreak >= achievement.requirementValue || unlocked.has(achievement.code),
    unlockedAt: unlocked.get(achievement.code) || null
  }));

  return {
    currentStreak: Number(game.current_streak || stats.currentStreak),
    longestStreak: stats.longestStreak,
    weeklyConsistency: stats.weeklyConsistency,
    activeDaysInLast7: stats.activeDaysInLast7,
    lastActiveDate: stats.lastActiveDate,
    totalWorkoutsThisWeek: weekly.workoutCount,
    totalMinutesThisWeek: weekly.totalMinutes,
    totalCaloriesThisWeek: weekly.totalCalories,
    totalXp: Number(game.total_xp || 0),
    level: Number(game.level || levelData.level),
    nextLevelXp: Number(game.next_level_xp || levelData.nextLevelXp),
    streakMessage: streakMessage(stats.currentStreak),
    badges,
    newlyUnlocked: newlyUnlocked.map((achievement) => ({
      code: achievement.code,
      name: achievement.name,
      description: achievement.description
    }))
  };
}

async function recordAutoWorkout(userId, payload) {
  const slug = normalizeCategorySlug(payload);
  if (!CATEGORY_MET_DATA[slug]) throw httpError("Choose a supported workout category.", 400);

  const durationMin = Number(payload.duration_min ?? payload.durationMin ?? 0);
  const distanceKm = Number(payload.distance_km ?? payload.distanceKm ?? 0);
  if (durationMin <= 0) throw httpError("Duration must be greater than zero.", 400);
  if (["running", "cycling", "walking", "swimming"].includes(slug) && distanceKm <= 0) {
    throw httpError("Distance is required for cardio workouts.", 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userRows] = await connection.execute("SELECT weight FROM users WHERE id = ? LIMIT 1", [userId]);
    if (!userRows[0]) throw httpError("User not found.", 404);
    const weightKg = Number(payload.user_weight || payload.userWeight || userRows[0].weight || 70);
    const categoryMeta = await getCategoryMeta(slug, connection);
    const met = getWorkoutMet(payload, categoryMeta);
    const xp = await calculateXP(payload, userId, { categoryMeta, executor: connection, multiplier: 1 });
    const calories = calculateCalories(payload, weightKg, { categoryMeta, met });
    const date = payload.date || toDateStr(new Date());
    const workoutId = createId("wk");
    const title = payload.title || categoryMeta.name;

    await connection.execute(
      `INSERT INTO workouts (
         id, user_id, date, title, duration_total, calories_total, calories_burned,
         calories_source, user_weight_at_log, notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'auto', ?, ?)`,
      [
        workoutId,
        userId,
        date,
        title,
        durationMin,
        calories,
        calories,
        weightKg,
        payload.notes || (distanceKm > 0 ? `${distanceKm} km • ${met.toFixed(2)} MET` : `${met.toFixed(2)} MET`)
      ]
    );

    await connection.execute(
      `INSERT INTO workout_exercises (
         id, workout_id, category_id, category_name, exercise_name, duration, calories_burned
       )
       VALUES (?, ?, (SELECT id FROM exercise_categories WHERE slug = ? LIMIT 1), ?, ?, ?, ?)`,
      [createId("ex"), workoutId, slug, categoryMeta.name, title, durationMin, calories]
    );

    const [gameRows] = await connection.execute(
      "SELECT * FROM user_gamification WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    const game = gameRows[0] || null;
    if (!game) {
      await connection.execute("INSERT INTO user_gamification (user_id) VALUES (?)", [userId]);
    }

    const multiplier = game?.current_streak >= 7 ? 1.25 : game?.current_streak >= 3 ? 1.1 : 1;
    const xpEarned = Math.floor(xp * multiplier);
    const streakState = nextStreakState(game, date);
    const newTotalXp = Number(game?.total_xp || 0) + xpEarned;
    const levelData = levelFromXp(newTotalXp);

    await connection.execute(
      `UPDATE user_gamification
       SET total_xp = ?, level = ?, next_level_xp = ?, current_streak = ?, longest_streak = ?,
           last_active_date = ?, weekly_freezes_used = ?, last_freeze_week = ?
       WHERE user_id = ?`,
      [
        newTotalXp,
        levelData.level,
        levelData.nextLevelXp,
        streakState.currentStreak,
        streakState.longestStreak,
        date,
        streakState.weeklyFreezesUsed,
        streakState.lastFreezeWeek,
        userId
      ]
    );

    await connection.execute(
      `INSERT INTO xp_logs (id, user_id, workout_id, xp_earned, reason, breakdown)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        createId("xp"),
        userId,
        workoutId,
        xpEarned,
        `Auto ${categoryMeta.name} reward`,
        JSON.stringify({
          category: slug,
          met,
          duration_min: durationMin,
          distance_km: distanceKm || undefined,
          calories_burned: calories,
          multiplier
        })
      ]
    );

    await connection.commit();

    return {
      id: workoutId,
      xp_earned: xpEarned,
      calories_burned: calories,
      new_total_xp: newTotalXp,
      level: levelData.level,
      streak: streakState.currentStreak,
      next_level_xp: levelData.nextLevelXp
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

const gamificationService = {
  calculateXP,
  calculateCalories,
  getWorkoutMet,
  CATEGORY_MET_DATA,
  recordAutoWorkout,

  async getSummary(userId) {
    return buildSummary(userId);
  },

  async recordCheckin(userId, type) {
    const today = toDateStr(new Date());
    const created = await gamificationRepository.addCheckin(userId, today, type || "Wellness check-in");
    const summary = await buildSummary(userId);
    return { ...summary, checkinCreated: created, alreadyCheckedIn: !created };
  },

  async getStatistics() {
    return gamificationRepository.getStreakStatistics();
  }
};

module.exports = {
  gamificationService,
  calculateXP,
  calculateCalories,
  getWorkoutMet,
  CATEGORY_MET_DATA
};

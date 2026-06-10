const pool = require("../config/db");
const { gamificationRepository } = require("../repositories/gamificationRepository");
const { computeStreakStats, streakMessage, toDateStr } = require("../utils/streak");
const { createId } = require("../utils/ids");

/**
 * Returns the current local date string (YYYY-MM-DD) in the Asia/Phnom_Penh timezone.
 * Uses Intl.DateTimeFormat — no external library required.
 * @returns {string}
 */
function getTodayLocal() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Helper to get Cambodia timezone local components.
 */
function getCambodiaParts(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;

  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: hour,
    minute: parseInt(get('minute'), 10),
    second: parseInt(get('second'), 10)
  };
}

/**
 * Helper to construct Date object from Cambodia local components.
 */
function fromCambodiaParts(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second));
}

/**
 * Helper to get Cambodia day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 */
function getCambodiaDayOfWeek(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Phnom_Penh',
    weekday: 'long'
  });
  const dayName = formatter.format(date);
  const days = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return days[dayName];
}

/**
 * Format Date to YYYY-MM-DD in Cambodia timezone.
 */
function toCambodiaDateStr(date) {
  const parts = getCambodiaParts(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * Format Date to YYYY-MM-DD HH:mm:ss in UTC for MySQL datetime.
 */
function toMysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Calculate week start (Monday) and end (Sunday) strings, and the restore deadline.
 */
function getCambodiaWeekInfo(date) {
  const parts = getCambodiaParts(date);
  const localMidnight = fromCambodiaParts(parts.year, parts.month, parts.day, 0, 0, 0);
  const dayOfWeek = getCambodiaDayOfWeek(date);
  const daysToMonday = (dayOfWeek === 0) ? -6 : (1 - dayOfWeek);
  const mondayDate = new Date(localMidnight.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
  const sundayDate = new Date(mondayDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  // Deadline is Sunday 23:59:59 Cambodia local time
  const sundayDeadline = new Date(mondayDate.getTime() + (7 * 24 * 60 * 60 * 1000) - 1000);
  
  return {
    mondayStr: toCambodiaDateStr(mondayDate),
    sundayStr: toCambodiaDateStr(sundayDate),
    mondayDate,
    sundayDate,
    sundayDeadline
  };
}

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
    `INSERT INTO achievements (code, name, description, requirement_type, requirement_value, sort_order)
     VALUES (?, ?, ?, 'level', 0, 100)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description)`,
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
 * Queries today's workout totals for a user using Asia/Phnom_Penh local date.
 * Uses workouts.xp, workouts.duration_total, workouts.calories_total.
 * @param {string} userId User id.
 * @returns {Promise<{todayWorkouts: number, todayMinutes: number, todayCalories: number, todayXp: number}>}
 */
async function getTodaySummary(userId) {
  const todayLocal = getTodayLocal();
  const [[row]] = await pool.execute(
    `SELECT
       COUNT(*) AS workout_count,
       COALESCE(SUM(duration_total), 0) AS total_minutes,
       COALESCE(SUM(calories_total), 0) AS total_calories,
       COALESCE(SUM(xp), 0) AS total_xp
     FROM workouts
     WHERE user_id = ? AND date = ?`,
    [userId, todayLocal]
  );
  return {
    todayWorkouts: Number(row.workout_count),
    todayMinutes: Number(row.total_minutes),
    todayCalories: Number(row.total_calories),
    todayXp: Number(row.total_xp)
  };
}

/**
 * Returns weekly stats for the last 7 days.
 * @param {string} userId User id.
 * @returns {Promise<object>}
 */
async function getWeeklyStats(userId) {
  const [[row]] = await pool.execute(
    `SELECT
       COUNT(DISTINCT date) AS days_active,
       COUNT(*) AS total_workouts,
       COALESCE(SUM(calories_total), 0) AS total_calories,
       COALESCE(SUM(xp), 0) AS total_xp,
       COALESCE(SUM(duration_total), 0) AS total_minutes
     FROM workouts
     WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
    [userId]
  );

  // Most common workout title in the last 7 days
  const [topRows] = await pool.execute(
    `SELECT title, COUNT(*) AS cnt
     FROM workouts
     WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY title
     ORDER BY cnt DESC
     LIMIT 1`,
    [userId]
  );

  // Streak from existing helpers
  const activeDates = await gamificationRepository.getActivityDates(userId);
  const streakStats = computeStreakStats(activeDates);

  const daysActive = Number(row.days_active);
  const totalMinutes = Number(row.total_minutes);

  return {
    daysActive,
    workoutDays: daysActive,
    totalWorkouts: Number(row.total_workouts),
    totalCalories: Number(row.total_calories),
    totalXp: Number(row.total_xp),
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    topActivity: topRows[0]?.title || 'None',
    currentStreak: streakStats.currentStreak
  };
}

/**
 * Builds the authenticated user's gamification summary.
 * @param {string} userId User id.
 * @returns {Promise<object>}
 */
/**
 * Count workouts logged in the current week (Monday to Sunday).
 */
async function getCurrentWeekProgress(userId, executor = pool) {
  const weekInfo = getCambodiaWeekInfo(new Date());
  const [rows] = await executor.execute(
    `SELECT COUNT(DISTINCT date) AS active_days, COUNT(*) AS workout_count
     FROM workouts
     WHERE user_id = ? AND date >= ? AND date <= ?`,
    [userId, weekInfo.mondayStr, weekInfo.sundayStr]
  );
  return {
    activeDays: Number(rows[0]?.active_days || 0),
    workoutCount: Number(rows[0]?.workout_count || 0)
  };
}

/**
 * Check if the restore deadline has passed for an at-risk streak.
 */
async function expireMissedRestoreIfNeeded(userId, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT 
       streak_status, 
       DATE_FORMAT(restore_deadline, '%Y-%m-%dT%H:%i:%sZ') AS restore_deadline
     FROM user_gamification
     WHERE user_id = ?`,
    [userId]
  );
  if (!rows[0]) return;

  const { streak_status, restore_deadline } = rows[0];
  if (streak_status === 'at_risk' && restore_deadline) {
    const deadlineDate = new Date(restore_deadline);
    const now = new Date();
    if (now > deadlineDate) {
      // Deadline passed! Reset streak to 0 and set status to broken
      await executor.execute(
        `UPDATE user_gamification
         SET 
           weekly_streak = 0,
           streak_status = 'broken',
           restore_deadline = NULL,
           at_risk_week_start = NULL
         WHERE user_id = ?`,
        [userId]
      );
    }
  }
}

/**
 * Reset streak freezes to 2 and paid restores to 0 if the month has changed.
 */
async function resetMonthlyRestoreCounters(userId, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT DATE_FORMAT(last_freeze_reset, '%Y-%m-%d') AS last_freeze_reset FROM user_gamification WHERE user_id = ?`,
    [userId]
  );
  if (!rows[0]) return;

  const lastReset = rows[0].last_freeze_reset;
  const now = new Date();
  const nowStr = toCambodiaDateStr(now);
  const currentMonth = nowStr.slice(0, 7);

  if (!lastReset || !lastReset.startsWith(currentMonth)) {
    await executor.execute(
      `UPDATE user_gamification
       SET 
         streak_freezes = 2,
         paid_restores_this_month = 0,
         last_freeze_reset = ?
       WHERE user_id = ?`,
      [nowStr, userId]
    );
  }
}

/**
 * Evaluate if the previous completed week was successful or missed.
 */
async function processPreviousCompletedWeek(userId, executor = pool) {
  const currentWeekInfo = getCambodiaWeekInfo(new Date());
  const currentWeekStart = currentWeekInfo.mondayStr;
  
  const previousWeekMondayDate = new Date(currentWeekInfo.mondayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousWeekStart = toCambodiaDateStr(previousWeekMondayDate);
  const previousWeekSunday = toCambodiaDateStr(new Date(previousWeekMondayDate.getTime() + 6 * 24 * 60 * 60 * 1000));
  
  const [gamification] = await executor.execute(
    `SELECT 
       weekly_streak, 
       weekly_longest_streak, 
       DATE_FORMAT(last_counted_week_start, '%Y-%m-%d') AS last_counted_week_start, 
       streak_status
     FROM user_gamification
     WHERE user_id = ?`,
    [userId]
  );
  if (!gamification[0]) return;

  let {
    weekly_streak,
    weekly_longest_streak,
    last_counted_week_start,
    streak_status
  } = gamification[0];

  if (streak_status === 'broken' || streak_status === 'at_risk') {
    return;
  }

  if (last_counted_week_start === previousWeekStart) {
    return;
  }

  // Count workouts in the previous week
  const [countRows] = await executor.execute(
    `SELECT COUNT(*) AS workout_count
     FROM workouts
     WHERE user_id = ? AND date >= ? AND date <= ?`,
    [userId, previousWeekStart, previousWeekSunday]
  );
  const workoutCount = Number(countRows[0]?.workout_count || 0);

  if (last_counted_week_start === null) {
    if (workoutCount >= 3) {
      const newStreak = 1;
      const newLongest = Math.max(weekly_longest_streak, newStreak);
      await executor.execute(
        `UPDATE user_gamification
         SET 
           weekly_streak = ?,
           weekly_longest_streak = ?,
           last_counted_week_start = ?,
           streak_status = 'active'
         WHERE user_id = ?`,
        [newStreak, newLongest, previousWeekStart, userId]
      );
    } else {
      await executor.execute(
        `UPDATE user_gamification
         SET 
           last_counted_week_start = ?,
           streak_status = 'active'
         WHERE user_id = ?`,
        [previousWeekStart, userId]
      );
    }
    return;
  }

  const weekBeforePreviousMondayDate = new Date(previousWeekMondayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekBeforePreviousStart = toCambodiaDateStr(weekBeforePreviousMondayDate);

  if (last_counted_week_start === weekBeforePreviousStart) {
    if (workoutCount >= 3) {
      const newStreak = weekly_streak + 1;
      const newLongest = Math.max(weekly_longest_streak, newStreak);
      await executor.execute(
        `UPDATE user_gamification
         SET 
           weekly_streak = ?,
           weekly_longest_streak = ?,
           last_counted_week_start = ?,
           streak_status = 'active'
         WHERE user_id = ?`,
        [newStreak, newLongest, previousWeekStart, userId]
      );
    } else {
      if (weekly_streak > 0) {
        const deadline = toMysqlDateTime(currentWeekInfo.sundayDeadline);
        await executor.execute(
          `UPDATE user_gamification
           SET 
             streak_status = 'at_risk',
             at_risk_week_start = ?,
             restore_deadline = ?
           WHERE user_id = ?`,
          [previousWeekStart, deadline, userId]
        );
      } else {
        await executor.execute(
          `UPDATE user_gamification
           SET 
             last_counted_week_start = ?,
             streak_status = 'active'
           WHERE user_id = ?`,
          [previousWeekStart, userId]
        );
      }
    }
  } else {
    // Gap > 7 days, break streak
    await executor.execute(
      `UPDATE user_gamification
       SET 
         weekly_streak = 0,
         streak_status = 'broken',
         restore_deadline = NULL,
         at_risk_week_start = NULL
       WHERE user_id = ?`,
      [userId]
    );
  }
}

/**
 * Load the current weekly streak status after executing the pipeline.
 */
async function getWeeklyStreakStatus(userId, executor = pool) {
  await resetMonthlyRestoreCounters(userId, executor);
  await expireMissedRestoreIfNeeded(userId, executor);
  await processPreviousCompletedWeek(userId, executor);

  const [rows] = await executor.execute(
    `SELECT 
       weekly_streak,
       weekly_longest_streak,
       streak_status,
       streak_freezes,
       paid_restores_this_month,
       DATE_FORMAT(last_counted_week_start, '%Y-%m-%d') AS last_counted_week_start,
       DATE_FORMAT(at_risk_week_start, '%Y-%m-%d') AS at_risk_week_start,
       DATE_FORMAT(restore_deadline, '%Y-%m-%dT%H:%i:%sZ') AS restore_deadline,
       total_xp
     FROM user_gamification
     WHERE user_id = ?`,
    [userId]
  );
  if (!rows[0]) {
    throw httpError("User gamification profile not found.", 404);
  }
  const statusData = rows[0];

  const weekInfo = getCambodiaWeekInfo(new Date());
  const progress = await getCurrentWeekProgress(userId, executor);

  const restoreCost = Math.min(150, 50 + 10 * statusData.weekly_streak);
  let restoreType = null;
  let canRestore = false;

  if (statusData.streak_status === 'at_risk') {
    if (statusData.streak_freezes > 0) {
      restoreType = 'freeze';
      canRestore = true;
    } else if (statusData.paid_restores_this_month < 2) {
      restoreType = 'xp';
      canRestore = statusData.total_xp >= restoreCost;
    } else {
      restoreType = 'limit_reached';
      canRestore = false;
    }
  }

  return {
    weeklyStreak: statusData.weekly_streak,
    weeklyLongestStreak: statusData.weekly_longest_streak,
    streakStatus: statusData.streak_status,
    streakFreezes: statusData.streak_freezes,
    paidRestoresThisMonth: statusData.paid_restores_this_month,
    lastCountedWeekStart: statusData.last_counted_week_start,
    atRiskWeekStart: statusData.at_risk_week_start,
    restoreDeadline: statusData.restore_deadline,
    currentWeekWorkoutCount: progress.workoutCount,
    currentWeekActiveDays: progress.activeDays,
    currentWeekMonday: weekInfo.mondayStr,
    currentWeekSunday: weekInfo.sundayStr,
    canRestore,
    restoreType,
    restoreCost,
    totalXp: statusData.total_xp
  };
}

/**
 * Restores an at-risk streak using a free freeze or XP.
 */
async function restoreStreak(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const status = await getWeeklyStreakStatus(userId, connection);
    if (!status.canRestore) {
      throw httpError("Cannot restore streak: requirements not met or limit reached.", 400);
    }

    if (status.restoreType === 'freeze') {
      await connection.execute(
        `UPDATE user_gamification
         SET 
           streak_freezes = streak_freezes - 1,
           streak_status = 'active',
           last_counted_week_start = ?,
           at_risk_week_start = NULL,
           restore_deadline = NULL
         WHERE user_id = ?`,
        [status.atRiskWeekStart, userId]
      );
    } else if (status.restoreType === 'xp') {
      const cost = status.restoreCost;
      await connection.execute(
        `UPDATE users 
         SET total_xp = GREATEST(0, CAST(total_xp AS SIGNED) - ?) 
         WHERE id = ?`,
        [cost, userId]
      );
      await connection.execute(
        `UPDATE user_gamification 
         SET 
           total_xp = GREATEST(0, CAST(total_xp AS SIGNED) - ?),
           paid_restores_this_month = paid_restores_this_month + 1,
           streak_status = 'active',
           last_counted_week_start = ?,
           at_risk_week_start = NULL,
           restore_deadline = NULL
         WHERE user_id = ?`,
        [cost, status.atRiskWeekStart, userId]
      );

      // Fetch new XP and update level
      const [userRow] = await connection.execute("SELECT total_xp FROM users WHERE id = ?", [userId]);
      const totalXp = Number(userRow[0].total_xp);
      const newLevel = await getCurrentLevel(totalXp, connection);
      const nextLevel = await getNextLevel(newLevel.levelNumber, connection);

      await connection.execute(
        `UPDATE user_gamification 
         SET level = ?, next_level_xp = ? 
         WHERE user_id = ?`,
        [newLevel.levelNumber, nextLevel?.xpRequired || totalXp, userId]
      );

      // Log XP deduction
      await connection.execute(
        `INSERT INTO xp_logs (id, user_id, xp_earned, reason, breakdown)
         VALUES (?, ?, ?, ?, ?)`,
        [
          createId("xp"),
          userId,
          -cost,
          "Weekly streak restore deduction",
          JSON.stringify({ restoreCost: cost, weeklyStreak: status.weeklyStreak })
        ]
      );
    }

    await connection.commit();
    return await getWeeklyStreakStatus(userId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Clears a broken streak and starts a new one.
 */
async function startNewStreak(userId) {
  const currentWeekInfo = getCambodiaWeekInfo(new Date());
  const previousWeekMondayDate = new Date(currentWeekInfo.mondayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousWeekStart = toCambodiaDateStr(previousWeekMondayDate);

  await pool.execute(
    `UPDATE user_gamification
     SET 
       weekly_streak = 0,
       streak_status = 'active',
       last_counted_week_start = ?,
       at_risk_week_start = NULL,
       restore_deadline = NULL
     WHERE user_id = ?`,
    [previousWeekStart, userId]
  );

  return await getWeeklyStreakStatus(userId);
}

/**
 * Builds the authenticated user's gamification summary.
 * @param {string} userId User id.
 * @returns {Promise<object>}
 */
async function buildSummary(userId) {
  const weeklyStatus = await getWeeklyStreakStatus(userId);

  const activeDates = await gamificationRepository.getActivityDates(userId);
  const stats = computeStreakStats(activeDates);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekly = await gamificationRepository.getWeeklyWorkoutTotals(userId, toDateStr(sevenDaysAgo));

  // Sync to user_streaks table for admin stats and compatibility
  await gamificationRepository.upsertStreak(
    userId,
    weeklyStatus.weeklyStreak,
    weeklyStatus.weeklyLongestStreak,
    weeklyStatus.lastCountedWeekStart
  );

  const [[userRow]] = await pool.execute("SELECT COALESCE(total_xp, 0) AS total_xp FROM users WHERE id = ?", [
    userId
  ]);
  const totalXp = Number(userRow?.total_xp || 0);
  const level = await getCurrentLevel(totalXp);
  const nextLevel = await getNextLevel(level.levelNumber);
  const catalog = await gamificationRepository.getAchievementCatalog();
  const unlocked = await gamificationRepository.getUnlockedAchievements(userId);
  const todayData = await getTodaySummary(userId);

  const visibleCatalog = catalog.filter(
    (achievement) => achievement.isActive || unlocked.has(achievement.code)
  );

  return {
    currentStreak: weeklyStatus.weeklyStreak,
    longestStreak: weeklyStatus.weeklyLongestStreak,
    weeklyConsistency: stats.weeklyConsistency,
    activeDaysInLast7: stats.activeDaysInLast7,
    lastActiveDate: weeklyStatus.lastCountedWeekStart || stats.lastActiveDate,
    totalWorkoutsThisWeek: weeklyStatus.currentWeekWorkoutCount,
    totalMinutesThisWeek: weekly.totalMinutes,
    totalCaloriesThisWeek: weekly.totalCalories,
    todayWorkouts: todayData.todayWorkouts,
    todayMinutes: todayData.todayMinutes,
    todayCalories: todayData.todayCalories,
    todayXp: todayData.todayXp,
    totalXp,
    total_xp: totalXp,
    level: level.levelNumber,
    title: level.title,
    nextLevelXp: nextLevel?.xpRequired || totalXp,
    next_level_xp: nextLevel?.xpRequired || totalXp,
    streakMessage: streakMessage(weeklyStatus.weeklyStreak),
    badges: visibleCatalog.map((achievement) => ({
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      requirement: achievement.requirementType,
      value: achievement.requirementValue,
      isUnlocked: unlocked.has(achievement.code),
      unlockedAt: unlocked.get(achievement.code) || null,
      icon: achievement.icon || null
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
  getTodaySummary,
  getWeeklyStats,
  getWeeklyStreakStatus,
  restoreStreak,
  startNewStreak,

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
  getWeeklyStats,
  calculateXP,
  calculateCalories,
  CATEGORY_MET_DATA: CATEGORY_PROFILES,
  getCambodiaWeekInfo,
  getCambodiaDayOfWeek,
  toCambodiaDateStr,
  fromCambodiaParts
};

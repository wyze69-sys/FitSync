const pool = require("../config/db");
const { createId } = require("../utils/ids");

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/**
 * Returns the sorted list of unique "active" dates for a user, combining
 * logged workouts, weight entries, and manual wellness check-ins.
 */
async function getActivityDates(userId) {
  const [rows] = await pool.execute(
    `SELECT date FROM workouts WHERE user_id = ?
     UNION
     SELECT date FROM weight_logs WHERE user_id = ?
     UNION
     SELECT date FROM daily_checkins WHERE user_id = ?`,
    [userId, userId, userId]
  );
  return rows
    .map((row) => formatDate(row.date))
    .filter(Boolean)
    .sort();
}

async function getWeeklyWorkoutTotals(userId, fromDate) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS workout_count,
            COALESCE(SUM(duration_total), 0) AS total_minutes,
            COALESCE(SUM(calories_total), 0) AS total_calories
     FROM workouts
     WHERE user_id = ? AND date >= ?`,
    [userId, fromDate]
  );
  return {
    workoutCount: Number(row.workout_count),
    totalMinutes: Number(row.total_minutes),
    totalCalories: Number(row.total_calories)
  };
}

async function addCheckin(userId, date, type, executor = pool) {
  const [result] = await executor.execute(
    `INSERT IGNORE INTO daily_checkins (id, user_id, date, type) VALUES (?, ?, ?, ?)`,
    [createId("chk"), userId, date, type]
  );
  return result.affectedRows > 0;
}

async function getAchievementCatalog() {
  const [rows] = await pool.execute(
    "SELECT code, name, description, requirement_type, requirement_value, sort_order, icon, is_active FROM achievements ORDER BY sort_order ASC"
  );
  return rows.map((row) => ({
    code: row.code,
    name: row.name,
    description: row.description,
    requirementType: row.requirement_type,
    requirementValue: Number(row.requirement_value),
    sortOrder: Number(row.sort_order),
    icon: row.icon || null,
    isActive: row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active)
  }));
}

async function getUnlockedAchievements(userId) {
  const [rows] = await pool.execute(
    "SELECT achievement_code, unlocked_at FROM user_achievements WHERE user_id = ?",
    [userId]
  );
  const map = new Map();
  for (const row of rows) {
    map.set(row.achievement_code, row.unlocked_at);
  }
  return map;
}

async function unlockAchievement(userId, code) {
  const [result] = await pool.execute(
    `INSERT IGNORE INTO user_achievements (id, user_id, achievement_code) VALUES (?, ?, ?)`,
    [createId("ach"), userId, code]
  );
  return result.affectedRows > 0;
}

async function upsertStreak(userId, currentStreak, longestStreak, lastActiveDate) {
  await pool.execute(
    `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       current_streak = VALUES(current_streak),
       longest_streak = GREATEST(longest_streak, VALUES(longest_streak)),
       last_active_date = VALUES(last_active_date)`,
    [userId, currentStreak, longestStreak, lastActiveDate || null]
  );
}

/**
 * Aggregated streak / engagement statistics for the admin dashboard.
 */
async function getStreakStatistics() {
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [[streaks]] = await pool.query(
    `SELECT COALESCE(MAX(current_streak), 0) AS longest_active,
            COALESCE(MAX(longest_streak), 0) AS longest_ever,
            COALESCE(ROUND(AVG(current_streak), 1), 0) AS avg_current
     FROM user_streaks`
  );
  const [[checkins]] = await pool.query("SELECT COUNT(*) AS total FROM daily_checkins");
  const [[unlocks]] = await pool.query("SELECT COUNT(*) AS total FROM user_achievements");
  const [[active]] = await pool.query(
    `SELECT COUNT(DISTINCT user_id) AS total FROM (
       SELECT user_id, date FROM workouts WHERE date >= ?
       UNION
       SELECT user_id, date FROM weight_logs WHERE date >= ?
       UNION
       SELECT user_id, date FROM daily_checkins WHERE date >= ?
     ) AS recent`,
    [sevenDaysAgo, sevenDaysAgo, sevenDaysAgo]
  );

  return {
    longestActiveStreak: Number(streaks.longest_active),
    longestEverStreak: Number(streaks.longest_ever),
    averageCurrentStreak: Number(streaks.avg_current),
    totalCheckins: Number(checkins.total),
    totalAchievementsUnlocked: Number(unlocks.total),
    activeUsersLast7Days: Number(active.total)
  };
}

module.exports = {
  gamificationRepository: {
    getActivityDates,
    getWeeklyWorkoutTotals,
    addCheckin,
    getAchievementCatalog,
    getUnlockedAchievements,
    unlockAchievement,
    upsertStreak,
    getStreakStatistics
  }
};

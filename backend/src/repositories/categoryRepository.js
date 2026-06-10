const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapCategoryRow } = require("../utils/rowMappers");

async function getCategories() {
  const [rows] = await pool.execute(
    "SELECT * FROM exercise_categories ORDER BY is_custom ASC, name ASC"
  );
  return rows.map(mapCategoryRow);
}

async function createCategory(category) {
  const id = createId("cat");

  await pool.execute(
    `INSERT INTO exercise_categories (id, name, description, is_custom)
     VALUES (?, ?, ?, ?)`,
    [id, category.name, category.description, true]
  );

  const [rows] = await pool.execute("SELECT * FROM exercise_categories WHERE id = ?", [id]);
  return mapCategoryRow(rows[0]);
}

async function updateCategory(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }

  if (fields.length > 0) {
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE exercise_categories SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error("Category not found");
    }
  }

  if (updates.name !== undefined) {
    await pool.execute("UPDATE workout_exercises SET category_name = ? WHERE category_id = ?", [
      updates.name,
      id
    ]);
  }

  const [rows] = await pool.execute("SELECT * FROM exercise_categories WHERE id = ?", [id]);
  if (!rows[0]) {
    throw new Error("Category not found");
  }
  return mapCategoryRow(rows[0]);
}

async function deleteCategory(id) {
  const [rows] = await pool.execute("SELECT is_custom FROM exercise_categories WHERE id = ?", [id]);
  if (!rows[0]) return false;

  if (!rows[0].is_custom) {
    throw new Error("Cannot delete core default categories. System required.");
  }

  const [result] = await pool.execute("DELETE FROM exercise_categories WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

async function countRows(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return Number(rows[0]?.total || 0);
}

async function getSystemStats() {
  const [totalUsers, totalWorkouts, totalWeightEntries, totalInsightsGenerated, recentWorkoutsRows] = await Promise.all(
    [
      countRows("SELECT COUNT(*) AS total FROM users WHERE role <> 'admin'"),
      countRows("SELECT COUNT(*) AS total FROM workouts"),
      countRows("SELECT COUNT(*) AS total FROM weight_logs"),
      countRows("SELECT COUNT(*) AS total FROM ai_insights"),
      pool.execute(`
        SELECT w.id, w.date, w.title, w.duration_total, u.name as user_name
        FROM workouts w
        JOIN users u ON u.id = w.user_id
        ORDER BY w.created_at DESC
        LIMIT 5
      `).then(res => res[0])
    ]
  );

  return {
    totalUsers,
    totalWorkouts,
    totalWeightEntries,
    totalInsightsGenerated,
    recentWorkouts: recentWorkoutsRows.map(row => ({
      id: row.id,
      user: row.user_name,
      title: row.title,
      dur: Number(row.duration_total),
      date: String(row.date).slice(0, 10)
    }))
  };
}

/**
 * Usage analytics per exercise category: how many times each category has been
 * logged, plus the total minutes and calories attributed to it.
 */
async function getCategoryAnalytics() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.is_custom,
            COUNT(we.id) AS usage_count,
            COALESCE(SUM(we.duration), 0) AS total_minutes,
            COALESCE(SUM(we.calories_burned), 0) AS total_calories
     FROM exercise_categories c
     LEFT JOIN workout_exercises we ON we.category_id = c.id
     GROUP BY c.id, c.name, c.is_custom
     ORDER BY usage_count DESC, c.name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isCustom: Boolean(row.is_custom),
    usageCount: Number(row.usage_count),
    totalMinutes: Number(row.total_minutes),
    totalCalories: Number(row.total_calories)
  }));
}

/**
 * Aggregated analytics data for the admin analytics page.
 * Uses only real DB queries — no synthetic or fake numbers.
 */
async function getAnalyticsData() {
  // Workouts by category with usage stats
  const [categoryRows] = await pool.query(
    `SELECT c.id, c.name, c.is_custom,
            COUNT(we.id) AS usage_count,
            COALESCE(SUM(we.duration), 0) AS total_minutes,
            COALESCE(SUM(we.calories_burned), 0) AS total_calories
     FROM exercise_categories c
     LEFT JOIN workout_exercises we ON we.category_id = c.id
     GROUP BY c.id, c.name, c.is_custom
     ORDER BY usage_count DESC, c.name ASC`
  );

  const workoutsByCategory = categoryRows.map((row) => ({
    id: row.id,
    name: row.name,
    isCustom: Boolean(row.is_custom),
    usageCount: Number(row.usage_count),
    totalMinutes: Number(row.total_minutes),
    totalCalories: Number(row.total_calories)
  }));

  const mostUsedCategory = workoutsByCategory.length > 0 && workoutsByCategory[0].usageCount > 0
    ? workoutsByCategory[0]
    : null;

  // Active users: had at least one workout in the last 30 days
  const [[activeRow]] = await pool.query(
    `SELECT COUNT(DISTINCT user_id) AS total
     FROM workouts
     WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
  );
  const activeUsers = Number(activeRow.total);

  // Total non-admin users
  const [[totalUserRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users WHERE role <> 'admin'`
  );
  const totalUsers = Number(totalUserRow.total);
  const inactiveUsers = Math.max(0, totalUsers - activeUsers);

  // Feedback counts by status
  let feedbackByStatus = { new: 0, in_progress: 0, resolved: 0, archived: 0 };
  try {
    const [fbRows] = await pool.query(
      `SELECT status, COUNT(*) AS total FROM user_feedback GROUP BY status`
    );
    for (const row of fbRows) {
      if (feedbackByStatus[row.status] !== undefined) {
        feedbackByStatus[row.status] = Number(row.total);
      }
    }
  } catch (err) {
    // Table may not exist yet on fresh deployments — keep zero counts
  }

  // Active challenges count
  const [[challengeRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM challenges WHERE is_active = TRUE`
  );
  const activeChallengesCount = Number(challengeRow.total);

  // Active announcements count (not expired)
  const [[announcementRow]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM announcements
     WHERE is_active = TRUE
       AND (end_at IS NULL OR end_at >= NOW())`
  );
  const activeAnnouncementsCount = Number(announcementRow.total);

  return {
    workoutsByCategory,
    mostUsedCategory,
    activeUsers,
    inactiveUsers,
    totalUsers,
    feedbackByStatus,
    activeChallengesCount,
    activeAnnouncementsCount,
    templateUsageTracked: false
  };
}

module.exports = {
  categoryRepository: {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getSystemStats,
    getCategoryAnalytics,
    getAnalyticsData
  }
};

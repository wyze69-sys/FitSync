const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapCategoryRow } = require("../utils/rowMappers");

async function getCategories() {
  const [rows] = await pool.execute("SELECT * FROM exercise_categories ORDER BY is_custom ASC, name ASC");
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
    await pool.execute("UPDATE workout_exercises SET category_name = ? WHERE category_id = ?", [updates.name, id]);
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
  const [totalUsers, totalWorkouts, totalWeightEntries, totalInsightsGenerated] = await Promise.all([
    countRows("SELECT COUNT(*) AS total FROM users WHERE role <> 'admin'"),
    countRows("SELECT COUNT(*) AS total FROM workouts"),
    countRows("SELECT COUNT(*) AS total FROM weight_logs"),
    countRows("SELECT COUNT(*) AS total FROM ai_insights")
  ]);

  return {
    totalUsers,
    totalWorkouts,
    totalWeightEntries,
    totalInsightsGenerated
  };
}

module.exports = {
  categoryRepository: {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getSystemStats
  }
};

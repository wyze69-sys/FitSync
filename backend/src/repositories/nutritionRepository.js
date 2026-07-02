const pool = require("../config/db");

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function mapFoodRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    servingSize: row.serving_size,
    calories: Number(row.calories || 0),
    proteinG: Number(row.protein_g || 0),
    carbsG: Number(row.carbs_g || 0),
    fatG: Number(row.fat_g || 0),
    fiberG: Number(row.fiber_g || 0),
    sugarG: Number(row.sugar_g || 0),
    sodiumMg: Number(row.sodium_mg || 0),
    foodType: row.food_type || "general",
    dietTags: parseJsonArray(row.diet_tags),
    sourceDataset: row.source_dataset,
    sourceFile: row.source_file,
    sourceGroup: row.source_group,
    isActive: Boolean(row.is_active)
  };
}

async function listFoods(filters = {}) {
  const conditions = ["is_active = TRUE"];
  const params = [];
  const search = String(filters.search || "").trim();
  if (search) {
    conditions.push("(name LIKE ? OR food_type LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (filters.foodType) {
    conditions.push("food_type = ?");
    params.push(String(filters.foodType).trim().toLowerCase());
  }
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const [rows] = await pool.execute(
    `SELECT * FROM nutrition_foods WHERE ${conditions.join(" AND ")} ORDER BY name ASC LIMIT ${limit}`,
    params
  );
  return rows.map(mapFoodRow);
}

async function getFoodById(id) {
  const [rows] = await pool.execute("SELECT * FROM nutrition_foods WHERE id = ? LIMIT 1", [String(id || "")]);
  return rows[0] ? mapFoodRow(rows[0]) : null;
}

async function getRecommendationPool(limit = 1200) {
  const safeLimit = Math.min(2500, Math.max(100, Number(limit) || 1200));
  const [rows] = await pool.query(
    `SELECT * FROM nutrition_foods WHERE is_active = TRUE ORDER BY calories DESC LIMIT ${safeLimit}`
  );
  return rows.map(mapFoodRow);
}

module.exports = {
  nutritionRepository: {
    listFoods,
    getFoodById,
    getRecommendationPool
  },
  mapFoodRow
};

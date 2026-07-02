const fs = require("node:fs");
const path = require("node:path");

const DATASET_PATH = path.join(__dirname, "..", "..", "..", "database", "datasets", "nutrition_foods.csv");

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function inferFoodType(name) {
  const n = String(name || "").toLowerCase();
  if (/chicken|turkey|beef|pork|fish|salmon|tuna|egg|shrimp|yogurt|cheese|tofu|beans|lentil|protein/.test(n)) return "protein";
  if (/rice|oat|pasta|bread|potato|corn|bagel|pancake|cereal|noodle|quinoa|barley/.test(n)) return "carb";
  if (/apple|banana|orange|berry|fruit|mango|grape|melon|peach|pear/.test(n)) return "fruit";
  if (/broccoli|spinach|salad|vegetable|carrot|lettuce|cabbage|kale|pepper|tomato/.test(n)) return "vegetable";
  if (/peanut|almond|walnut|cashew|butter|oil|avocado|tahini/.test(n)) return "fat";
  if (/water|juice|milk|tea|coffee|smoothie|drink|beverage/.test(n)) return "drink";
  return "general";
}

function dietTagsFor(food) {
  const tags = [];
  const name = food.name.toLowerCase();
  if (food.proteinG >= 15) tags.push("high_protein");
  if (food.carbsG >= 30) tags.push("carb_source");
  if (food.fiberG >= 4) tags.push("high_fiber");
  if (food.calories <= 180) tags.push("lower_calorie");
  if (food.fatG >= 15) tags.push("higher_fat");
  if (!/beef|pork|chicken|turkey|fish|salmon|tuna|shrimp|ham|bacon|egg/.test(name)) tags.push("vegetarian_friendly");
  return tags;
}

let cachedFoods = null;

function loadNutritionFoods() {
  if (cachedFoods) return cachedFoods;
  const raw = fs.readFileSync(DATASET_PATH, "utf8").trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift());
  const foods = lines.map((line) => {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const food = {
      id: row.id,
      name: row.name,
      servingSize: row.serving_size || "dataset serving",
      calories: Math.round(toNumber(row.calories)),
      proteinG: toNumber(row.protein_g),
      carbsG: toNumber(row.carbs_g),
      fatG: toNumber(row.fat_g),
      fiberG: toNumber(row.fiber_g),
      sugarG: toNumber(row.sugar_g),
      sodiumMg: toNumber(row.sodium_mg),
      sourceDataset: row.source_dataset,
      sourceFile: row.source_file,
      sourceGroup: row.source_group,
      foodType: inferFoodType(row.name)
    };
    food.dietTags = dietTagsFor(food);
    return food;
  });
  cachedFoods = foods;
  return foods;
}

module.exports = {
  DATASET_PATH,
  loadNutritionFoods,
  inferFoodType,
  dietTagsFor
};

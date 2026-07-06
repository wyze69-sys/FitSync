const test = require("node:test");
const assert = require("node:assert");

const { loadNutritionFoods, inferFoodType } = require("../src/data/nutritionFoodDataset");
const { recommendFoods } = require("../src/utils/nutritionRecommender");

test("nutrition dataset loads track_daily food CSV with macro fields", () => {
  const foods = loadNutritionFoods();
  assert.ok(foods.length >= 2000, `expected at least 2000 foods, found ${foods.length}`);

  const chicken = foods.find((food) => food.id === "kung-pao-chicken");
  assert.ok(chicken, "expected kung-pao-chicken from source dataset");
  assert.strictEqual(chicken.calories, 779);
  assert.ok(chicken.proteinG >= 50);
  assert.ok(chicken.carbsG >= 40);
  assert.ok(chicken.sourceDataset.includes("Kaggle"));
});

test("nutrition dataset infers useful food types and diet tags", () => {
  assert.strictEqual(inferFoodType("chicken breast"), "protein");
  assert.strictEqual(inferFoodType("brown rice"), "carb");
  assert.strictEqual(inferFoodType("spinach salad"), "vegetable");

  const peanutButter = loadNutritionFoods().find((food) => food.id === "peanut-butter");
  assert.ok(peanutButter.dietTags.includes("vegetarian_friendly"));
});

test("recommendations are deterministic and dataset-grounded for strength recovery", () => {
  const foods = loadNutritionFoods();
  const recommendations = recommendFoods(foods, {
    goal: "muscle gain",
    workoutType: "strength",
    caloriesBurned: 450,
    limit: 8
  });

  assert.strictEqual(recommendations.length, 8);
  assert.ok(recommendations.every((food) => food.id && food.name && food.sourceDataset), "all results come from dataset rows");
  assert.ok(recommendations.some((food) => food.proteinG >= 15), "strength recommendations should include protein-rich foods");
  assert.ok(recommendations[0].recommendationScore >= recommendations[1].recommendationScore);
  assert.ok(Array.isArray(recommendations[0].recommendationReasons));
});

test("recommendations can prioritize lower-calorie weight-loss options", () => {
  const foods = loadNutritionFoods();
  const recommendations = recommendFoods(foods, {
    goal: "lose weight",
    workoutType: "mobility",
    limit: 12
  });

  assert.strictEqual(recommendations.length, 12);
  assert.ok(recommendations.some((food) => food.calories <= 220), "weight-loss recommendations should include lower-calorie foods");
});

test("recommendations prefer protein-balanced options for muscle-gain goals and penalize pure carb-heavy/low-protein foods", () => {
  const foods = [
    { id: "chicken-breast", name: "Chicken Breast", calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0, sugarG: 0, sodiumMg: 74, foodType: "protein", dietTags: [], isActive: true },
    { id: "white-rice", name: "White Rice", calories: 205, proteinG: 4.2, carbsG: 45, fatG: 0.4, fiberG: 0.6, sugarG: 0.1, sodiumMg: 0, foodType: "grain", dietTags: [], isActive: true },
    { id: "banana", name: "Banana", calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.3, fiberG: 3, sugarG: 14, sodiumMg: 1, foodType: "fruit", dietTags: [], isActive: true },
    { id: "peanut-butter", name: "Peanut Butter", calories: 188, proteinG: 8, carbsG: 6, fatG: 16, fiberG: 1.9, sugarG: 3, sodiumMg: 152, foodType: "fat", dietTags: [], isActive: true },
    { id: "oatmeal-balanced", name: "Oatmeal Balanced", calories: 150, proteinG: 10, carbsG: 22, fatG: 2.5, fiberG: 4, sugarG: 1, sodiumMg: 2, foodType: "grain", dietTags: [], isActive: true }
  ];

  // 1. Muscle Gain Goal
  const gainRecs = recommendFoods(foods, {
    goal: "muscle gain",
    limit: 5
  });

  // Chicken breast has very high protein density and should rank high
  assert.strictEqual(gainRecs[0].id, "chicken-breast", "chicken-breast should be ranked #1 for muscle gain");

  // Oatmeal Balanced has 10g carbs & 10g protein (moderate carb + protein bonus)
  assert.ok(gainRecs.some(r => r.id === "oatmeal-balanced"), "oatmeal-balanced should be recommended");

  // White rice should be penalized (carbsG > 40 and proteinG < 6)
  const riceRec = gainRecs.find((r) => r.id === "white-rice");
  // It should either be filtered out (score <= 0) or ranked very low
  if (riceRec) {
    assert.ok(gainRecs.indexOf(riceRec) > 1, "white rice should be ranked low if included");
  }

  // 2. Weight Loss Goal
  const lossRecs = recommendFoods(foods, {
    goal: "lose weight",
    limit: 5
  });
  // Chicken breast should also rank high
  assert.ok(lossRecs.some(r => r.id === "chicken-breast"), "chicken breast should be in loss recommendations");

  // 3. Balanced/Maintenance Goal
  const maintRecs = recommendFoods(foods, {
    goal: "maintain fitness",
    limit: 5
  });
  assert.ok(maintRecs.length > 0);
});

test("extreme-carb foods with decent protein score lower than balanced muscle-gain meals", () => {
  const { scoreFood } = require("../src/utils/nutritionRecommender");
  const ctx = { goal: "muscle gain" };

  // Balanced mixed meal: protein-rich, moderate carbs
  const burrito = { name: "burrito with beans beef", calories: 450, proteinG: 27.8, carbsG: 47, fatG: 18, fiberG: 8, sugarG: 2, sodiumMg: 0.01 };
  // Dry grain: protein decent but extreme carbs + raw penalty
  const couscousDry = { name: "couscous dry", calories: 340, proteinG: 22.1, carbsG: 134, fatG: 1.1, fiberG: 7, sugarG: 0.6, sodiumMg: 0.01 };
  // Dense snack: protein decent but extreme carbs + high fat
  const bagelChips = { name: "bagel chips", calories: 600, proteinG: 21.6, carbsG: 116.1, fatG: 26.5, fiberG: 3.5, sugarG: 4, sodiumMg: 1.2 };
  // Balanced legume-protein: high protein density, low-moderate carbs
  const edamame = { name: "edamame cooked", calories: 188, proteinG: 18.5, carbsG: 13.8, fatG: 8.1, fiberG: 8.1, sugarG: 3.4, sodiumMg: 0.01 };

  const burritoScore = scoreFood(burrito, ctx).score;
  const couscousScore = scoreFood(couscousDry, ctx).score;
  const bagelScore = scoreFood(bagelChips, ctx).score;
  const edamameScore = scoreFood(edamame, ctx).score;

  // Balanced meals must outscore extreme-carb items
  assert.ok(burritoScore > couscousScore, `burrito (${burritoScore}) should outscore couscous dry (${couscousScore})`);
  assert.ok(burritoScore > bagelScore, `burrito (${burritoScore}) should outscore bagel chips (${bagelScore})`);
  assert.ok(edamameScore > couscousScore, `edamame (${edamameScore}) should outscore couscous dry (${couscousScore})`);
  assert.ok(edamameScore > bagelScore, `edamame (${edamameScore}) should outscore bagel chips (${bagelScore})`);
});

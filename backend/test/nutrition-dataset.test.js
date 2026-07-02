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

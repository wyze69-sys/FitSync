function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function clampLimit(limit, fallback = 12) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(50, Math.max(1, Math.round(n)));
}

function goalProfile(goal = "") {
  const g = normalize(goal);
  if (/muscle|gain|bulk|strength/.test(g)) return { name: "muscle_gain", protein: 4, carbs: 2, lowerCalories: 0 };
  if (/loss|lose|cut|fat|tone/.test(g)) return { name: "weight_loss", protein: 3, fiber: 3, lowerCalories: 3, carbs: -0.5 };
  if (/endurance|cardio|run|sport/.test(g)) return { name: "endurance", carbs: 4, protein: 1.5, lowerCalories: 0 };
  return { name: "balanced", protein: 2, carbs: 1.5, fiber: 1, lowerCalories: 1 };
}

function workoutProfile(workoutType = "", caloriesBurned = 0) {
  const w = normalize(workoutType);
  const burned = Number(caloriesBurned) || 0;
  const profile = { protein: 0, carbs: 0, fiber: 0, hydration: 0, minCalories: 0 };
  if (/strength|hiit|weight|lift/.test(w)) profile.protein += 3;
  if (/cardio|run|cycling|sport|hiit/.test(w)) profile.carbs += 3;
  if (/yoga|mobility|recovery|stretch/.test(w)) profile.fiber += 1;
  if (burned >= 400) {
    profile.carbs += 2;
    profile.protein += 1;
    profile.minCalories = 180;
  }
  return profile;
}

function scoreFood(food, context = {}) {
  const goal = goalProfile(context.goal);
  const workout = workoutProfile(context.workoutType || context.category, context.caloriesBurned);
  let score = 0;
  const reasons = [];

  if (food.proteinG >= 15) {
    score += (goal.protein || 0) + (workout.protein || 0) + 2;
    reasons.push("high protein for recovery");
  } else if (food.proteinG >= 8) {
    score += ((goal.protein || 0) + (workout.protein || 0)) * 0.6;
    reasons.push("moderate protein");
  }

  if (food.carbsG >= 25) {
    score += (goal.carbs || 0) + (workout.carbs || 0);
    if ((workout.carbs || 0) > 0) reasons.push("carbs to refill workout energy");
  }

  if (food.fiberG >= 4) {
    score += (goal.fiber || 0) + (workout.fiber || 0) + 1;
    reasons.push("fiber for fullness");
  }

  if (goal.lowerCalories && food.calories <= 220) {
    score += goal.lowerCalories;
    reasons.push("lower calorie option");
  }

  if (workout.minCalories && food.calories >= workout.minCalories) score += 1;


  const name = normalize(food.name);
  const processedPenalty = /burger king|mcdonald|wendy|kfc|kentucky fried|pizza hut|whopper|big mac|fries|fried|crispy|donut|cake|candy|soda/.test(name);
  const rawIngredientPenalty = /\b(raw|uncooked|unprepared|dehydrated|dried|powder|flour|yeast|starch|baking|spices|seasoning|lard|tallow|shortening|gjetost|catupiry|neufchatel|dry mix|broth|gravy|gelatin)\b/.test(name);
  if (food.calories <= 0) score -= 10;
  if (food.calories > 750 && goal.name !== "muscle_gain") score -= 3;
  if (food.calories > 1000) score -= 4;
  if (food.fatG > 35) score -= 2;
  if (processedPenalty) score -= 4;
  if (rawIngredientPenalty) score -= 15;

  if (food.sugarG > 25 && !/cardio|run|hiit|sport/.test(normalize(context.workoutType || context.category))) score -= 1.5;
  if (food.sodiumMg > 1.5) score -= 0.5;

  return { score, reasons: [...new Set(reasons)].slice(0, 3), goalProfile: goal.name };
}

function recommendFoods(foods, context = {}) {
  const limit = clampLimit(context.limit, 12);
  const search = normalize(context.search);
  return foods
    .filter((food) => !search || normalize(food.name).includes(search) || food.dietTags.some((tag) => tag.includes(search)))
    .map((food) => {
      const scored = scoreFood(food, context);
      return { ...food, recommendationScore: Number(scored.score.toFixed(2)), recommendationReasons: scored.reasons, goalProfile: scored.goalProfile };
    })
    .filter((food) => food.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore || b.proteinG - a.proteinG || a.calories - b.calories)
    .slice(0, limit);
}

module.exports = {
  recommendFoods,
  scoreFood,
  goalProfile,
  workoutProfile,
  clampLimit
};

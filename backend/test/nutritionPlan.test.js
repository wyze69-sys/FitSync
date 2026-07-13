const test = require("node:test");
const assert = require("node:assert");

const { validate } = require("../src/middleware/validate");
const { nutritionPlanQuerySchema } = require("../src/validation/schemas");
const { nutritionService } = require("../src/services/nutritionService");
const { userRepository } = require("../src/repositories/userRepository");
const { nutritionRepository } = require("../src/repositories/nutritionRepository");
const { nutritionPlanWorkoutService } = require("../src/services/nutritionPlanWorkoutService");

// ---- helpers -------------------------------------------------------------

function runValidation(schema, query) {
  const req = { query };
  let statusCode = 200;
  let payload = null;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };
  validate(schema, "query")(req, res, () => {
    nextCalled = true;
  });
  return { statusCode, payload, nextCalled, req };
}

const completeUser = {
  id: "usr_1",
  weight: 80,
  height: 180,
  age: 30,
  gender: "male",
  goal: "Lose weight",
  activityLevel: "Sedentary",
  targetWeight: 72,
  preferredWorkoutType: "strength"
};

// A tiny but realistically-shaped pool from "nutrition_foods".
const fakePool = [
  {
    id: "chicken-breast",
    name: "Chicken breast",
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 0.07,
    dietTags: ["high_protein"],
    sourceDataset: "track_daily"
  },
  {
    id: "brown-rice",
    name: "Brown rice",
    calories: 216,
    proteinG: 5,
    carbsG: 45,
    fatG: 1.8,
    fiberG: 4,
    sugarG: 0,
    sodiumMg: 0.01,
    dietTags: ["vegetarian_friendly"],
    sourceDataset: "track_daily"
  },
  {
    id: "greek-yogurt",
    name: "Greek yogurt",
    calories: 100,
    proteinG: 17,
    carbsG: 6,
    fatG: 0.7,
    fiberG: 0,
    sugarG: 4,
    sodiumMg: 0.05,
    dietTags: ["high_protein"],
    sourceDataset: "track_daily"
  }
];

function emptyWindows() {
  const zero = (days, start, end) => ({
    days,
    startDate: start,
    endDate: end,
    workoutCount: 0,
    totalCaloriesBurned: 0,
    totalMinutes: 0,
    averageDailyBurn: 0,
    averageWorkoutBurn: 0
  });
  return {
    today: zero(1, "2026-07-01", "2026-07-01"),
    threeDays: zero(3, "2026-06-29", "2026-07-01"),
    sevenDays: zero(7, "2026-06-25", "2026-07-01"),
    thirtyDays: zero(30, "2026-06-02", "2026-07-01")
  };
}

async function withMocks({ user, pool = fakePool, windows = emptyWindows() }, fn) {
  const origUser = userRepository.getUserById;
  const origPool = nutritionRepository.getRecommendationPool;
  const origWindows = nutritionPlanWorkoutService.getWorkoutWindowsForUser;

  userRepository.getUserById = async () => user;
  nutritionRepository.getRecommendationPool = async () => pool;
  nutritionPlanWorkoutService.getWorkoutWindowsForUser = async () => windows;

  try {
    return await fn();
  } finally {
    userRepository.getUserById = origUser;
    nutritionRepository.getRecommendationPool = origPool;
    nutritionPlanWorkoutService.getWorkoutWindowsForUser = origWindows;
  }
}

// ---- validation ----------------------------------------------------------

test("nutritionPlanQuerySchema applies default mode and limit", () => {
  const { statusCode, nextCalled, req } = runValidation(nutritionPlanQuerySchema, {});
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.query.mode, "safe");
  assert.strictEqual(req.query.limit, 8);
});

test("nutritionPlanQuerySchema rejects invalid mode", () => {
  const { statusCode, nextCalled } = runValidation(nutritionPlanQuerySchema, { mode: "turbo" });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test("nutritionPlanQuerySchema rejects out-of-range timeframe and limit", () => {
  assert.strictEqual(runValidation(nutritionPlanQuerySchema, { timeframeDays: 0 }).statusCode, 400);
  assert.strictEqual(runValidation(nutritionPlanQuerySchema, { timeframeDays: 1000 }).statusCode, 400);
  assert.strictEqual(runValidation(nutritionPlanQuerySchema, { limit: 999 }).statusCode, 400);
});

test("nutritionPlanQuerySchema accepts a negative targetChangeKg", () => {
  const { statusCode, req } = runValidation(nutritionPlanQuerySchema, {
    targetChangeKg: -3,
    timeframeDays: 30
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(req.query.targetChangeKg, -3);
  assert.strictEqual(req.query.timeframeDays, 30);
});

// ---- service: incomplete profile ----------------------------------------

test("getPlan returns isIncomplete true and missingFields for an incomplete profile", async () => {
  const partialUser = { id: "usr_2", weight: 80, height: 180 }; // missing age/gender/goal/activityLevel
  await withMocks({ user: partialUser }, async () => {
    const plan = await nutritionService.getPlan("usr_2", {});
    assert.strictEqual(plan.profile.isIncomplete, true);
    assert.deepStrictEqual(
      plan.profile.missingFields.sort(),
      ["activityLevel", "age", "gender", "goal"].sort()
    );
    assert.strictEqual(plan.activePlan, null);
    assert.strictEqual(plan.safePlan, null);
    assert.strictEqual(plan.requestedPlan, null);
    assert.strictEqual(plan.macros, null);
    assert.deepStrictEqual(plan.recommendations, []);
    assert.strictEqual(plan.source, "nutrition_foods");
    assert.ok(plan.warnings.length > 0);
  });
});

test("getPlan throws 404 when the user does not exist", async () => {
  await withMocks({ user: undefined }, async () => {
    await assert.rejects(
      () => nutritionService.getPlan("missing", {}),
      (err) => err.status === 404
    );
  });
});

// ---- service: complete profile ------------------------------------------

test("getPlan returns calculations, plans and macros for a complete profile", async () => {
  await withMocks({ user: completeUser }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});

    assert.strictEqual(plan.profile.isIncomplete, false);
    assert.strictEqual(plan.profile.weightKg, 80); // from user.weight
    assert.strictEqual(plan.profile.heightCm, 180); // from user.height

    assert.ok(plan.calculations && typeof plan.calculations.bmr === "number");
    assert.ok(typeof plan.calculations.tdee === "number");
    assert.ok(typeof plan.calculations.activityFactor === "number");
    assert.ok(typeof plan.calculations.calorieFloor === "number");

    assert.ok(plan.safePlan && typeof plan.safePlan.calories === "number");
    assert.ok(plan.requestedPlan && typeof plan.requestedPlan.calories === "number");
    assert.ok(plan.activePlan && typeof plan.activePlan.calories === "number");
    assert.ok(plan.macros && typeof plan.macros.proteinG === "number");

    assert.ok(Array.isArray(plan.timeframeOptions) && plan.timeframeOptions.length === 4);
    assert.ok(plan.windows && plan.windows.today && plan.windows.thirtyDays);
    assert.strictEqual(plan.source, "nutrition_foods");
  });
});

test("getPlan flags an aggressive requested target with a warning", async () => {
  await withMocks({ user: completeUser }, async () => {
    // 12kg loss over 30 days => ~2.8 kg/week => high_risk
    const plan = await nutritionService.getPlan("usr_1", {
      targetChangeKg: -12,
      timeframeDays: 30,
      mode: "requested"
    });
    assert.ok(["aggressive", "high_risk"].includes(plan.requestedPlan.safetyStatus));
    assert.ok(plan.warnings.length > 0, "expected safety warnings");
  });
});

test("getPlan weight-loss users add back 25% capped at 200, base calories unchanged", async () => {
  const windowsNoWorkout = emptyWindows();
  const windowsWorkout600 = emptyWindows();
  windowsWorkout600.today.workoutCount = 1;
  windowsWorkout600.today.totalCaloriesBurned = 600; // 25% = 150

  const windowsWorkout1200 = emptyWindows();
  windowsWorkout1200.today.workoutCount = 1;
  windowsWorkout1200.today.totalCaloriesBurned = 1200; // 25% = 300, capped at 200

  // 1. Base calorie plan target
  let baseCalories;
  await withMocks({ user: completeUser, windows: windowsNoWorkout }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});
    baseCalories = plan.activePlan.calories;
    assert.strictEqual(plan.calculations.todayWorkoutCalories, 0);
    assert.strictEqual(plan.calculations.workoutCaloriesAddedBack, 0);
    assert.strictEqual(plan.calculations.todayAdjustedTarget, baseCalories);
  });

  // 2. 25% add back below cap (600 -> 150)
  await withMocks({ user: completeUser, windows: windowsWorkout600 }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});
    assert.strictEqual(plan.calculations.todayWorkoutCalories, 600);
    assert.strictEqual(plan.calculations.workoutCaloriesAddedBack, 150);
    assert.strictEqual(plan.calculations.todayAdjustedTarget, baseCalories + 150);
    assert.strictEqual(plan.activePlan.calories, baseCalories, "base activePlan.calories should remain unchanged");
    assert.ok(
      plan.notes.some((n) => n.includes("For weight loss, FitSync adds back only a small part of workout calories")),
      "expected the weight loss workout-allowance note"
    );
  });

  // 3. 25% add back capped at 200 (1200 -> 200)
  await withMocks({ user: completeUser, windows: windowsWorkout1200 }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});
    assert.strictEqual(plan.calculations.todayWorkoutCalories, 1200);
    assert.strictEqual(plan.calculations.workoutCaloriesAddedBack, 200);
    assert.strictEqual(plan.calculations.todayAdjustedTarget, baseCalories + 200);
    assert.strictEqual(plan.activePlan.calories, baseCalories, "base activePlan.calories should remain unchanged");
  });
});

test("getPlan maintain/gain users add back 50% capped at 400, base calories unchanged", async () => {
  const maintainUser = { ...completeUser, goal: "Maintain weight" };
  const windowsNoWorkout = emptyWindows();
  const windowsWorkout600 = emptyWindows();
  windowsWorkout600.today.workoutCount = 1;
  windowsWorkout600.today.totalCaloriesBurned = 600; // 50% = 300

  const windowsWorkout1200 = emptyWindows();
  windowsWorkout1200.today.workoutCount = 1;
  windowsWorkout1200.today.totalCaloriesBurned = 1200; // 50% = 600, capped at 400

  // 1. Base calorie plan target
  let baseCalories;
  await withMocks({ user: maintainUser, windows: windowsNoWorkout }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});
    baseCalories = plan.activePlan.calories;
    assert.strictEqual(plan.calculations.todayWorkoutCalories, 0);
    assert.strictEqual(plan.calculations.workoutCaloriesAddedBack, 0);
    assert.strictEqual(plan.calculations.todayAdjustedTarget, baseCalories);
  });

  // 2. 50% add back below cap (600 -> 300)
  await withMocks({ user: maintainUser, windows: windowsWorkout600 }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});
    assert.strictEqual(plan.calculations.todayWorkoutCalories, 600);
    assert.strictEqual(plan.calculations.workoutCaloriesAddedBack, 300);
    assert.strictEqual(plan.calculations.todayAdjustedTarget, baseCalories + 300);
    assert.strictEqual(plan.activePlan.calories, baseCalories, "base activePlan.calories should remain unchanged");
    assert.ok(
      plan.notes.some((n) => n.includes("Today workout burn partially increases today's food allowance")),
      "expected the maintain/gain workout-allowance note"
    );
  });

  // 3. 50% add back capped at 400 (1200 -> 400)
  await withMocks({ user: maintainUser, windows: windowsWorkout1200 }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});
    assert.strictEqual(plan.calculations.todayWorkoutCalories, 1200);
    assert.strictEqual(plan.calculations.workoutCaloriesAddedBack, 400);
    assert.strictEqual(plan.calculations.todayAdjustedTarget, baseCalories + 400);
    assert.strictEqual(plan.activePlan.calories, baseCalories, "base activePlan.calories should remain unchanged");
  });
});

test("getPlan returns recommendations from nutrition_foods only", async () => {
  await withMocks({ user: completeUser }, async () => {
    const plan = await nutritionService.getPlan("usr_1", {});
    assert.ok(Array.isArray(plan.recommendations));
    assert.ok(plan.recommendations.length > 0, "expected some recommendations");
    // Every recommended food originates from the injected dataset pool.
    const poolIds = new Set(fakePool.map((f) => f.id));
    assert.ok(plan.recommendations.every((food) => poolIds.has(food.id)));
    assert.ok(plan.recommendations.every((food) => food.sourceDataset === "track_daily"));
    assert.strictEqual(plan.source, "nutrition_foods");
  });
});

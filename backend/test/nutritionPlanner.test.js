const test = require("node:test");
const assert = require("node:assert");

const {
  getMissingNutritionFields,
  calculateBmr,
  getActivityFactor,
  calculateTdee,
  classifyGoalSafety,
  buildNutritionPlans,
  calculateMacroTargets,
  buildTimeframeOptions
} = require("../src/utils/nutritionPlanner");

const baseProfile = {
  weight: 80, // kg
  height: 180, // cm
  age: 30,
  gender: "male",
  goal: "Maintain fitness",
  activityLevel: "Sedentary"
};

test("getMissingNutritionFields detects missing required fields", () => {
  const { isComplete, missingFields } = getMissingNutritionFields({
    weight: 80,
    height: 180
    // age, gender, goal, activityLevel missing
  });
  assert.strictEqual(isComplete, false);
  assert.deepStrictEqual(missingFields.sort(), ["activityLevel", "age", "gender", "goal"].sort());
});

test("getMissingNutritionFields returns complete for full profile", () => {
  const { isComplete, missingFields } = getMissingNutritionFields(baseProfile);
  assert.strictEqual(isComplete, true);
  assert.deepStrictEqual(missingFields, []);
});

test("getMissingNutritionFields treats non-positive numbers as missing", () => {
  const { missingFields } = getMissingNutritionFields({ ...baseProfile, weight: 0, height: -1 });
  assert.ok(missingFields.includes("weight"));
  assert.ok(missingFields.includes("height"));
});

test("calculateBmr male/female/other formulas", () => {
  // base = 10*80 + 6.25*180 - 5*30 = 800 + 1125 - 150 = 1775
  const male = calculateBmr({ ...baseProfile, gender: "male" });
  const female = calculateBmr({ ...baseProfile, gender: "female" });
  const other = calculateBmr({ ...baseProfile, gender: "other" });

  assert.strictEqual(male, 1780); // +5
  assert.strictEqual(female, 1614); // -161
  assert.strictEqual(other, 1697); // -78 (neutral average)
  // other is the arithmetic midpoint of male and female
  assert.strictEqual(other, Math.round((male + female) / 2));
});

test("getActivityFactor maps FitSync labels and is case-insensitive", () => {
  assert.strictEqual(getActivityFactor("Sedentary"), 1.2);
  assert.strictEqual(getActivityFactor("Lightly active"), 1.375);
  assert.strictEqual(getActivityFactor("Moderately active"), 1.55);
  assert.strictEqual(getActivityFactor("Very active"), 1.9);
  assert.strictEqual(getActivityFactor("VERY ACTIVE"), 1.9);
  assert.strictEqual(getActivityFactor("active"), 1.725);
  // unknown -> sedentary fallback
  assert.strictEqual(getActivityFactor("space walking"), 1.2);
  assert.strictEqual(getActivityFactor(undefined), 1.2);
});

test("calculateTdee multiplies BMR by activity factor", () => {
  const { bmr, activityFactor, tdee } = calculateTdee(baseProfile);
  assert.strictEqual(bmr, 1780);
  assert.strictEqual(activityFactor, 1.2);
  assert.strictEqual(tdee, Math.round(1780 * 1.2)); // 2136
});

test("default lose weight goal creates a safe calorie deficit", () => {
  const profile = { ...baseProfile, goal: "Lose weight" };
  const { safePlan, activePlan, tdee } = buildNutritionPlans({ profile });
  assert.ok(safePlan.calories < tdee, "safe calories should be below TDEE");
  assert.strictEqual(safePlan.dailyCalorieAdjustment, -400);
  assert.strictEqual(safePlan.safetyStatus, "safe");
  assert.strictEqual(activePlan, safePlan); // default active = safe
});

test("default gain muscle goal creates a safe calorie surplus", () => {
  const profile = { ...baseProfile, goal: "Gain muscle" };
  const { safePlan, tdee } = buildNutritionPlans({ profile });
  assert.ok(safePlan.calories > tdee, "safe calories should be above TDEE");
  assert.strictEqual(safePlan.dailyCalorieAdjustment, 250);
  assert.strictEqual(safePlan.safetyStatus, "safe");
});

test("requested aggressive loss is flagged aggressive/high_risk", () => {
  const profile = { ...baseProfile, goal: "Lose weight" };
  // 10kg over 30 days => ~2.33 kg/week => high_risk
  const { requestedPlan } = buildNutritionPlans({
    profile,
    targetChangeKg: -10,
    timeframeDays: 30,
    mode: "requested"
  });
  assert.ok(
    ["aggressive", "high_risk"].includes(requestedPlan.safetyStatus),
    `expected aggressive/high_risk, got ${requestedPlan.safetyStatus}`
  );
  assert.strictEqual(requestedPlan.direction, "lose");
});

test("calorie floor warning is returned and safe plan is clamped", () => {
  // Small light female with an extreme deficit request drives below the floor.
  const profile = {
    weight: 50,
    height: 160,
    age: 25,
    gender: "female",
    goal: "Lose weight",
    activityLevel: "Sedentary"
  };
  const result = buildNutritionPlans({
    profile,
    targetChangeKg: -6,
    timeframeDays: 30,
    mode: "requested"
  });
  const floor = result.calorieFloor;
  assert.strictEqual(floor, 1200);
  assert.ok(result.warnings.some((w) => w.toLowerCase().includes("floor")));
  assert.ok(result.safePlan.calories >= floor, "safe plan must not go below the floor");
  assert.strictEqual(result.requestedPlan.safetyStatus, "high_risk");
});

test("macro targets change by goal", () => {
  const calories = 2000;
  const plan = { calories };

  const loseMacros = calculateMacroTargets({
    profile: { ...baseProfile, goal: "Lose weight" },
    plan
  });
  const gainMacros = calculateMacroTargets({
    profile: { ...baseProfile, goal: "Gain muscle" },
    plan
  });
  const maintainMacros = calculateMacroTargets({
    profile: { ...baseProfile, goal: "Maintain fitness" },
    plan
  });

  // protein g/kg: lose 1.8, gain 2.2, maintain 1.6 -> at 80kg = 144, 176, 128
  assert.strictEqual(loseMacros.proteinG, 144);
  assert.strictEqual(gainMacros.proteinG, 176);
  assert.strictEqual(maintainMacros.proteinG, 128);
  assert.notStrictEqual(loseMacros.proteinG, gainMacros.proteinG);

  // macro percentages should roughly sum to 100
  const sum = loseMacros.proteinPct + loseMacros.carbsPct + loseMacros.fatPct;
  assert.ok(sum >= 97 && sum <= 103, `macro pct sum ~100, got ${sum}`);
});

test("macro targets clamp and warn on very low carbs", () => {
  // Tiny calorie budget with heavy protein makes carbs negative/low.
  const macros = calculateMacroTargets({
    profile: { ...baseProfile, weight: 120, goal: "Gain muscle" },
    plan: { calories: 1200 }
  });
  assert.ok(macros.carbsG >= 0, "carbs should be clamped to >= 0");
  assert.ok(macros.warnings.length > 0, "expected a low-carb warning");
});

test("timeframe options include 1 day, 3 days, 1 week, and 1 month", () => {
  const profile = { ...baseProfile, goal: "Lose weight" };
  const { activePlan } = buildNutritionPlans({ profile });
  const options = buildTimeframeOptions({ profile, plan: activePlan });

  const labels = options.map((o) => o.label);
  assert.deepStrictEqual(labels, ["1 day", "3 days", "1 week", "1 month"]);

  const days = options.map((o) => o.days);
  assert.deepStrictEqual(days, [1, 3, 7, 30]);

  for (const opt of options) {
    assert.ok(typeof opt.targetCaloriesTotal === "number");
    assert.ok(typeof opt.expectedWeightChangeKg === "number");
    assert.ok(typeof opt.safetyStatus === "string");
    assert.ok(typeof opt.note === "string" && opt.note.length > 0);
  }

  // For a lose plan the monthly projection should be a net loss.
  const month = options.find((o) => o.days === 30);
  assert.ok(month.expectedWeightChangeKg < 0);
});

test("classifyGoalSafety thresholds for loss and gain", () => {
  // loss: 1kg/week safe, 1.4 aggressive, 2 high_risk
  assert.strictEqual(
    classifyGoalSafety({ goal: "Lose weight", targetChangeKg: -1, timeframeDays: 7 }).safetyStatus,
    "safe"
  );
  assert.strictEqual(
    classifyGoalSafety({ goal: "Lose weight", targetChangeKg: -1.4, timeframeDays: 7 })
      .safetyStatus,
    "aggressive"
  );
  assert.strictEqual(
    classifyGoalSafety({ goal: "Lose weight", targetChangeKg: -2, timeframeDays: 7 }).safetyStatus,
    "high_risk"
  );
  // gain: 0.5 safe, 0.7 caution, 0.9 aggressive, 1.2 high_risk
  assert.strictEqual(
    classifyGoalSafety({ goal: "Gain muscle", targetChangeKg: 0.5, timeframeDays: 7 })
      .safetyStatus,
    "safe"
  );
  assert.strictEqual(
    classifyGoalSafety({ goal: "Gain muscle", targetChangeKg: 0.7, timeframeDays: 7 })
      .safetyStatus,
    "caution"
  );
  assert.strictEqual(
    classifyGoalSafety({ goal: "Gain muscle", targetChangeKg: 0.9, timeframeDays: 7 })
      .safetyStatus,
    "aggressive"
  );
  assert.strictEqual(
    classifyGoalSafety({ goal: "Gain muscle", targetChangeKg: 1.2, timeframeDays: 7 })
      .safetyStatus,
    "high_risk"
  );
});

test("aggressive weight gain goals handle safety, warnings, and macro calculations correctly", () => {
  const profile = {
    weight: 80,
    height: 180,
    age: 30,
    gender: "male",
    goal: "Gain muscle",
    activityLevel: "Sedentary"
  };

  // Case 1: Maintenance goal
  const maintainResult = buildNutritionPlans({
    profile: { ...profile, goal: "Maintain fitness" },
    mode: "safe"
  });
  const maintainMacros = calculateMacroTargets({
    profile: { ...profile, goal: "Maintain fitness" },
    plan: maintainResult.activePlan
  });
  assert.strictEqual(maintainMacros.proteinG, 128); // 80 * 1.6
  assert.strictEqual(maintainResult.activePlan.safetyStatus, "safe");

  // Case 2: Moderate gain
  const moderateResult = buildNutritionPlans({
    profile,
    targetChangeKg: 1.5, // 1.5kg over 30 days = 0.35kg/week (safe)
    timeframeDays: 30,
    mode: "requested"
  });
  const moderateMacros = calculateMacroTargets({
    profile,
    plan: moderateResult.activePlan
  });
  assert.strictEqual(moderateResult.activePlan.safetyStatus, "safe");
  assert.strictEqual(moderateMacros.proteinG, 176); // 80 * 2.2
  // fat target = 25% of calories
  const expectedFatG = Math.round((moderateResult.activePlan.calories * 0.25) / 9);
  assert.strictEqual(moderateMacros.fatG, expectedFatG);
  // carbs fill remaining calories
  const expectedCarbsG = Math.round((moderateResult.activePlan.calories - (176 * 4) - (expectedFatG * 9)) / 4);
  assert.strictEqual(moderateMacros.carbsG, expectedCarbsG);

  // Case 3: Aggressive gain (e.g. +10kg in 30 days = 2.33 kg/week -> high_risk)
  const aggressiveResult = buildNutritionPlans({
    profile,
    targetChangeKg: 10,
    timeframeDays: 30,
    mode: "requested"
  });
  
  const warningFound = aggressiveResult.warnings.some((w) => 
    w.toLowerCase().includes("excess fat gain") && w.toLowerCase().includes("lean muscle gain is better supported by the safe target")
  );
  assert.ok(warningFound, "Warning copy should mention excess fat gain and lean bulk recommendation");

  // Verify requestedPlan is marked high_risk
  assert.strictEqual(aggressiveResult.requestedPlan.safetyStatus, "high_risk");

  // Verify activePlan fallback to safePlan
  assert.strictEqual(aggressiveResult.activePlan.label, "Safe");
  assert.strictEqual(aggressiveResult.activePlan.calories, aggressiveResult.safePlan.calories);

  // Calculate macros for activePlan (which is the safePlan)
  const activeMacros = calculateMacroTargets({
    profile,
    plan: aggressiveResult.activePlan
  });

  // Verify macros are calculated based on safePlan, not the aggressive requested calories
  assert.strictEqual(activeMacros.calories, aggressiveResult.safePlan.calories);
  assert.strictEqual(activeMacros.proteinG, 176); // 80 * 2.2
  const expectedSafeFatG = Math.round((aggressiveResult.safePlan.calories * 0.25) / 9);
  assert.strictEqual(activeMacros.fatG, expectedSafeFatG);
  const expectedSafeCarbsG = Math.round((aggressiveResult.safePlan.calories - (176 * 4) - (expectedSafeFatG * 9)) / 4);
  assert.strictEqual(activeMacros.carbsG, expectedSafeCarbsG);
});

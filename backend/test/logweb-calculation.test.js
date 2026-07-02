const test = require("node:test");
const assert = require("node:assert");

const {
  calculateCalories,
  calculateXP,
  calculateXpBreakdown,
  cumulativeXpForLevel,
  xpNeededForNextLevel,
  restoreCostForWeeklyStreak,
  streakBonusForWeeklyStreak
} = require("../src/utils/calculators");

// ---------------------------------------------------------------------------
// 1. Calorie formula: calories = MET * 3.5 * weightKg / 200 * minutes
//    (strength applies an explainable active-time factor on top; see below)
// ---------------------------------------------------------------------------
test("calorie formula matches MET * 3.5 * weightKg / 200 * minutes", () => {
  // Base MET formula, cardio family (no strength active-time factor):
  // MET 5, 80kg, 30 min -> 5 * 3.5 * 80 / 200 * 30 = 210
  const calories = calculateCalories({ category: "cardio", duration_min: 30 }, 80, { met: 5 });
  assert.strictEqual(calories, 210);
});

test("strength applies the active-time factor (rest between sets)", () => {
  // Same inputs as the base formula, but strength scales by 0.65:
  // 5 * 3.5 * 80 / 200 * 30 = 210 -> 210 * 0.65 = 136.5 -> 137
  const calories = calculateCalories({ category: "strength", duration_min: 30 }, 80, { met: 5 });
  assert.strictEqual(calories, 137);
});

test("running calorie example: 40min, 70kg, MET 9.8 -> ~480 kcal", () => {
  // No distance -> running falls back to default MET 9.8.
  const calories = calculateCalories({ category: "running", duration_min: 40 }, 70);
  assert.strictEqual(calories, 480);
});

test("strength calorie example: 45min, 70kg, MET 6.0 -> ~215 kcal (active-time adjusted)", () => {
  // No volume -> base formula * strength active-time factor (0.65):
  // 6 * 3.5 * 70 / 200 * 45 = 330.75 -> * 0.65 = 214.99 -> 215.
  // Lower than an equivalent 45min high-MET cardio session (below).
  const calories = calculateCalories({ category: "strength", duration_min: 45 }, 70);
  assert.strictEqual(calories, 215);
});

test("strength 60min burns fewer calories than high-MET cardio 60min", () => {
  const strength = calculateCalories({ category: "strength", duration_min: 60 }, 70); // MET 6 * 0.65
  const cardio = calculateCalories({ category: "running", duration_min: 60 }, 70); // MET 9.8, continuous
  assert.ok(strength < cardio, `strength ${strength} should be < cardio ${cardio}`);
  assert.strictEqual(strength, 287); // 6*3.5*70/200*60=441 -> *0.65 = 286.65 -> 287
});

// ---------------------------------------------------------------------------
// 2. XP examples (logweb PDF section 4.1)
// ---------------------------------------------------------------------------
test("XP running example: 10km, 40min, MET 9.8, streak 0 -> 167 XP", () => {
  const breakdown = calculateXpBreakdown(
    { category: "running", distance_km: 10, duration_min: 40 },
    { weeklyStreak: 0 }
  );
  assert.strictEqual(breakdown.baseCompletionXp, 20);
  assert.strictEqual(breakdown.durationXp, 48);
  assert.strictEqual(Number(breakdown.intensityXp.toFixed(1)), 58.8);
  assert.strictEqual(breakdown.performanceBonus, 40);
  assert.strictEqual(breakdown.streakBonus, 0);
  assert.strictEqual(breakdown.finalXp, 167);
  assert.strictEqual(breakdown.formulaVersion, "logweb_pdf_v1");
});

test("XP strength example: 45min, MET 6.0, volume 5000kg, streak 3 -> 135 XP", () => {
  const breakdown = calculateXpBreakdown(
    { category: "strength", duration_min: 45 },
    { defaultMet: 6.0, totalVolumeKg: 5000, weeklyStreak: 3 }
  );
  assert.strictEqual(breakdown.durationXp, 54);
  assert.strictEqual(Number(breakdown.intensityXp.toFixed(1)), 40.5);
  assert.strictEqual(breakdown.strengthBonus, 10);
  assert.strictEqual(breakdown.performanceBonus, 10);
  assert.strictEqual(breakdown.streakBonus, 10);
  assert.strictEqual(breakdown.finalXp, 135);
  assert.strictEqual(breakdown.totalVolumeKg, 5000);
});

test("calculateXP returns the same finalXp as the breakdown", () => {
  const workout = { category: "running", distance_km: 10, duration_min: 40 };
  assert.strictEqual(calculateXP(workout, { weeklyStreak: 0 }), 167);
});

// ---------------------------------------------------------------------------
// 3. Level thresholds (logweb PDF section 5)
//    xpNeededForNextLevel = 100 + (level * 75) + (level^2 * 15)
// ---------------------------------------------------------------------------
test("cumulative level thresholds: L2=190, L3=500, L4=960", () => {
  assert.strictEqual(cumulativeXpForLevel(1), 0);
  assert.strictEqual(cumulativeXpForLevel(2), 190);
  assert.strictEqual(cumulativeXpForLevel(3), 500);
  assert.strictEqual(cumulativeXpForLevel(4), 960);
});

test("xpNeededForNextLevel matches the PDF formula", () => {
  assert.strictEqual(xpNeededForNextLevel(1), 190); // 100 + 75 + 15
  assert.strictEqual(xpNeededForNextLevel(2), 310); // 100 + 150 + 60
  assert.strictEqual(xpNeededForNextLevel(3), 460); // 100 + 225 + 135
});

// ---------------------------------------------------------------------------
// 4. Streak restore cost (logweb PDF section 6.1)
//    restoreCost = min(150, 50 + 10 * weeklyStreak)
// ---------------------------------------------------------------------------
test("restore cost = min(150, 50 + 10 * weeklyStreak)", () => {
  assert.strictEqual(restoreCostForWeeklyStreak(0), 50);
  assert.strictEqual(restoreCostForWeeklyStreak(1), 60);
  assert.strictEqual(restoreCostForWeeklyStreak(5), 100);
  assert.strictEqual(restoreCostForWeeklyStreak(10), 150); // capped
  assert.strictEqual(restoreCostForWeeklyStreak(20), 150); // capped
});

// ---------------------------------------------------------------------------
// 5. Weekly streak XP bonus tiers (PDF section 4; example uses streak 3 -> 10)
// ---------------------------------------------------------------------------
test("weekly streak bonus tiers", () => {
  assert.strictEqual(streakBonusForWeeklyStreak(0), 0);
  assert.strictEqual(streakBonusForWeeklyStreak(1), 10);
  assert.strictEqual(streakBonusForWeeklyStreak(2), 10);
  assert.strictEqual(streakBonusForWeeklyStreak(3), 10); // PDF worked example
  assert.strictEqual(streakBonusForWeeklyStreak(4), 15);
  assert.strictEqual(streakBonusForWeeklyStreak(5), 15);
  assert.strictEqual(streakBonusForWeeklyStreak(6), 25);
  assert.strictEqual(streakBonusForWeeklyStreak(12), 25);
});

const test = require("node:test");
const assert = require("node:assert");

const { calculateXP, calculateCalories } = require("../src/services/gamificationService");

// Expected values follow the logweb PDF calculation guide (logweb_pdf_v1):
//   calories = MET * 3.5 * weightKg / 200 * minutes
//   finalXp  = round(base 20 + durationXp + intensityXp + performanceBonus + streakBonus)
// Cardio MET is pace-adjusted for calories; XP intensity uses the category
// default MET. weeklyStreak defaults to 0 here (no streak bonus).
// [workout, weightKg, expectedXp, expectedCalories]
const cases = [
  [{ category: "running", distance_km: 10, duration_min: 40 }, 70, 167, 613],
  [{ category: "running", distance_km: 10, duration_min: 70 }, 70, 204, 711],
  [{ category: "cycling", distance_km: 10, duration_min: 40 }, 70, 153, 196],
  [{ category: "yoga-vinyasa", duration_min: 45 }, 70, 101, 221]
];

test("auto XP and calorie calculations match the logweb PDF formula", async () => {
  for (const [workout, weightKg, expectedXp, expectedCalories] of cases) {
    assert.strictEqual(await calculateXP(workout), expectedXp);
    assert.strictEqual(calculateCalories(workout, weightKg), expectedCalories);
  }
});

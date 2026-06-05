const test = require("node:test");
const assert = require("node:assert");

const { calculateXP, calculateCalories } = require("../src/services/gamificationService");

const cases = [
  [{ category: "running", distance_km: 10, duration_min: 40 }, 70, 100, 584],
  [{ category: "running", distance_km: 10, duration_min: 70 }, 70, 66, 677],
  [{ category: "cycling", distance_km: 10, duration_min: 40 }, 70, 32, 187],
  [{ category: "yoga-vinyasa", duration_min: 45 }, 70, 45, 210]
];

test("auto XP and calorie calculations match FitSync v2 examples", async () => {
  for (const [workout, weightKg, expectedXp, expectedCalories] of cases) {
    assert.strictEqual(await calculateXP(workout), expectedXp);
    assert.strictEqual(calculateCalories(workout, weightKg), expectedCalories);
  }
});

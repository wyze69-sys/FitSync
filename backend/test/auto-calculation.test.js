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

test("calculateXP accepts an explicit db executor as the third argument", async () => {
  const fakeDb = {
    async execute(sql) {
      if (sql.includes("exercise_categories")) {
        return [[{ name: "Running", slug: "running", base_met: 9.8, xp_per_met_min: 0.18 }]];
      }
      if (sql.includes("user_gamification")) {
        return [[{ current_streak: 0 }]];
      }
      return [[]];
    }
  };

  assert.strictEqual(
    await calculateXP({ category: "running", distance_km: 10, duration_min: 40 }, "usr_1", fakeDb),
    100
  );
});

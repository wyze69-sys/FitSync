const test = require("node:test");
const assert = require("node:assert");

const {
  toLocalDateString,
  addDays,
  getWorkoutCalories,
  getWorkoutDuration,
  summarizeWorkoutWindow,
  buildWorkoutWindows
} = require("../src/utils/nutritionWorkoutWindows");

const TODAY = "2026-07-01";

test("getWorkoutCalories uses caloriesBurned first", () => {
  const workout = { caloriesBurned: 300, caloriesTotal: 250, calories: 200 };
  assert.strictEqual(getWorkoutCalories(workout), 300);
});

test("getWorkoutCalories falls back to caloriesTotal", () => {
  const workout = { caloriesBurned: undefined, caloriesTotal: 250, calories: 200 };
  assert.strictEqual(getWorkoutCalories(workout), 250);
});

test("getWorkoutCalories falls back to calories", () => {
  const workout = { caloriesBurned: null, caloriesTotal: undefined, calories: 175 };
  assert.strictEqual(getWorkoutCalories(workout), 175);
});

test("getWorkoutCalories returns 0 for invalid/missing calories", () => {
  assert.strictEqual(getWorkoutCalories({}), 0);
  assert.strictEqual(getWorkoutCalories({ caloriesBurned: "abc", caloriesTotal: NaN }), 0);
  assert.strictEqual(getWorkoutCalories({ calories: Infinity }), 0);
});

test("getWorkoutDuration uses durationTotal when finite", () => {
  assert.strictEqual(getWorkoutDuration({ durationTotal: 45 }), 45);
});

test("getWorkoutDuration sums exercise durations when durationTotal missing", () => {
  const workout = {
    exercises: [{ duration: 20 }, { duration: 15 }, { duration: "x" }]
  };
  assert.strictEqual(getWorkoutDuration(workout), 35);
});

test("getWorkoutDuration returns 0 when nothing usable", () => {
  assert.strictEqual(getWorkoutDuration({}), 0);
  assert.strictEqual(getWorkoutDuration({ exercises: [] }), 0);
});

test("addDays does local calendar math without shifting", () => {
  assert.strictEqual(addDays("2026-07-01", -1), "2026-06-30");
  assert.strictEqual(addDays("2026-07-01", -2), "2026-06-29");
  assert.strictEqual(addDays("2026-07-01", -6), "2026-06-25");
  assert.strictEqual(addDays("2026-07-01", -29), "2026-06-02");
  assert.strictEqual(addDays("2026-03-01", -1), "2026-02-28"); // 2026 not leap
});

test("toLocalDateString keeps date-only strings intact", () => {
  assert.strictEqual(toLocalDateString("2026-07-01"), "2026-07-01");
  assert.strictEqual(toLocalDateString("2026-07-01T15:30:00.000Z"), "2026-07-01");
});

test("today window includes only today's workouts", () => {
  const workouts = [
    { date: TODAY, caloriesBurned: 200, durationTotal: 30 },
    { date: "2026-06-30", caloriesBurned: 500, durationTotal: 60 }
  ];
  const { today } = buildWorkoutWindows(workouts, TODAY);
  assert.strictEqual(today.days, 1);
  assert.strictEqual(today.startDate, TODAY);
  assert.strictEqual(today.endDate, TODAY);
  assert.strictEqual(today.workoutCount, 1);
  assert.strictEqual(today.totalCaloriesBurned, 200);
  assert.strictEqual(today.totalMinutes, 30);
});

test("3-day / 7-day / 30-day windows include the correct dates", () => {
  const workouts = [
    { date: "2026-07-01", caloriesBurned: 100, durationTotal: 10 }, // today
    { date: "2026-06-29", caloriesBurned: 100, durationTotal: 10 }, // in 3-day
    { date: "2026-06-25", caloriesBurned: 100, durationTotal: 10 }, // in 7-day
    { date: "2026-06-02", caloriesBurned: 100, durationTotal: 10 }, // in 30-day
    { date: "2026-06-01", caloriesBurned: 100, durationTotal: 10 } // outside 30-day
  ];
  const { threeDays, sevenDays, thirtyDays } = buildWorkoutWindows(workouts, TODAY);

  assert.strictEqual(threeDays.startDate, "2026-06-29");
  assert.strictEqual(threeDays.workoutCount, 2); // 07-01, 06-29

  assert.strictEqual(sevenDays.startDate, "2026-06-25");
  assert.strictEqual(sevenDays.workoutCount, 3); // + 06-25

  assert.strictEqual(thirtyDays.startDate, "2026-06-02");
  assert.strictEqual(thirtyDays.workoutCount, 4); // + 06-02, excludes 06-01
});

test("totals, minutes and averages are correct", () => {
  const workouts = [
    { date: "2026-07-01", caloriesBurned: 300, durationTotal: 40 },
    { date: "2026-06-30", caloriesBurned: 200, durationTotal: 20 },
    { date: "2026-06-29", caloriesBurned: 100, durationTotal: 30 }
  ];
  const { threeDays } = buildWorkoutWindows(workouts, TODAY);
  assert.strictEqual(threeDays.workoutCount, 3);
  assert.strictEqual(threeDays.totalCaloriesBurned, 600);
  assert.strictEqual(threeDays.totalMinutes, 90);
  assert.strictEqual(threeDays.averageDailyBurn, 200); // 600 / 3 days
  assert.strictEqual(threeDays.averageWorkoutBurn, 200); // 600 / 3 workouts
});

test("no workouts returns zeros", () => {
  const windows = buildWorkoutWindows([], TODAY);
  for (const key of ["today", "threeDays", "sevenDays", "thirtyDays"]) {
    const w = windows[key];
    assert.strictEqual(w.workoutCount, 0);
    assert.strictEqual(w.totalCaloriesBurned, 0);
    assert.strictEqual(w.totalMinutes, 0);
    assert.strictEqual(w.averageDailyBurn, 0);
    assert.strictEqual(w.averageWorkoutBurn, 0);
  }
});

test("date boundaries exclude workouts outside the window", () => {
  const workouts = [
    { date: "2026-06-28", caloriesBurned: 999, durationTotal: 99 } // just outside 3-day (>= 06-29)
  ];
  const { threeDays, sevenDays } = buildWorkoutWindows(workouts, TODAY);
  assert.strictEqual(threeDays.workoutCount, 0);
  assert.strictEqual(threeDays.totalCaloriesBurned, 0);
  // still inside the 7-day window (>= 06-25)
  assert.strictEqual(sevenDays.workoutCount, 1);
  assert.strictEqual(sevenDays.totalCaloriesBurned, 999);
});

test("summarizeWorkoutWindow honors calorie fallback order per workout", () => {
  const workouts = [
    { date: TODAY, caloriesBurned: 100 },
    { date: TODAY, caloriesTotal: 50 },
    { date: TODAY, calories: 25 },
    { date: TODAY } // 0
  ];
  const summary = summarizeWorkoutWindow(workouts, 1, TODAY, TODAY);
  assert.strictEqual(summary.workoutCount, 4);
  assert.strictEqual(summary.totalCaloriesBurned, 175);
});

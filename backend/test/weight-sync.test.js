const test = require("node:test");
const assert = require("node:assert");
const pool = require("../src/config/db");
const { userRepository } = require("../src/repositories/userRepository");
const { weightRepository } = require("../src/repositories/weightRepository");
const { workoutService } = require("../src/services/workoutService");
const { gamificationService } = require("../src/services/gamificationService");

test("userRepository.updateUser updates both weight and weight_kg", async () => {
  const originalExecute = pool.execute;

  let executedSql = null;
  let executedParams = null;

  pool.execute = async (sql, params) => {
    if (sql.includes("SELECT") && sql.includes("FROM users")) {
      return [[{ id: "usr_test", email: "test@fitsync.com", name: "Test User", role: "user", height: 175, weight: 70, is_active: 1 }], []];
    }
    if (sql.includes("SELECT") && sql.includes("FROM user_gamification")) {
      return [[{ total_xp: 100, level: 1, current_streak: 0, longest_streak: 0 }], []];
    }
    if (sql.includes("SELECT") && sql.includes("FROM workouts")) {
      return [[{ today_calories: 0, week_workouts: 0 }], []];
    }
    if (sql.includes("UPDATE users SET")) {
      executedSql = sql;
      executedParams = params;
    }
    if (sql.includes("SELECT id FROM weight_logs")) {
      return [[], []];
    }
    return [{ affectedRows: 1 }, []];
  };

  try {
    await userRepository.updateUser("usr_test", { weight: 82.5 });

    assert.ok(executedSql, "SQL UPDATE query should have been executed");
    assert.ok(executedSql.includes("weight = ?"), "SQL should update weight");
    assert.ok(executedSql.includes("weight_kg = ?"), "SQL should update weight_kg");

    const weightValuesCount = executedParams.filter(p => p === 82.5).length;
    assert.strictEqual(weightValuesCount, 2, "Weight value should be passed twice (for weight and weight_kg)");
  } finally {
    pool.execute = originalExecute;
  }
});

test("weightRepository.createWeightLog updates both weight and weight_kg", async () => {
  const originalExecute = pool.execute;
  let executedSql = null;
  let executedParams = null;

  pool.execute = async (sql, params) => {
    if (sql.includes("UPDATE users SET")) {
      executedSql = sql;
      executedParams = params;
    }
    if (sql.includes("SELECT * FROM weight_logs")) {
      return [[{ id: "w_test", user_id: "usr_test", date: "2026-05-01", weight: 82.5, bmi: 22.0, notes: "" }], []];
    }
    return [{ affectedRows: 1 }, []];
  };

  try {
    await weightRepository.createWeightLog({
      userId: "usr_test",
      date: "2026-05-01",
      weight: 82.5,
      bmi: 22.0,
      notes: "Log notes"
    });

    assert.ok(executedSql, "SQL UPDATE users query should have been executed");
    assert.ok(executedSql.includes("weight = ?"), "SQL should update weight");
    assert.ok(executedSql.includes("weight_kg = ?"), "SQL should update weight_kg");
    assert.deepStrictEqual(executedParams, [82.5, 82.5, "usr_test"], "Params should contain weight, weight_kg, and user ID");
  } finally {
    pool.execute = originalExecute;
  }
});

test("workoutService.createActivityWorkout prioritizes users.weight over users.weight_kg", async () => {
  const originalExecute = pool.execute;
  const originalCreateWorkout = require("../src/repositories/workoutRepository").workoutRepository?.createWorkout;
  const originalApplyWorkoutReward = require("../src/repositories/workoutRepository").workoutRepository?.applyWorkoutReward;
  const originalGetActivityBySlug = require("../src/repositories/activityRepository").activityRepository?.getActivityBySlug;

  const activityRepository = require("../src/repositories/activityRepository");
  activityRepository.activityRepository.getActivityBySlug = async () => ({
    id: "act_run",
    slug: "running",
    name: "Running",
    categorySlug: "cardio",
    calorieMethod: "met_duration",
    baseMet: 8.0,
    trackingFields: ["duration"]
  });

  let capturedWeight = null;
  const workoutRepository = require("../src/repositories/workoutRepository");
  workoutRepository.workoutRepository.createWorkout = async (workout) => {
    capturedWeight = workout.userWeightAtLog;
    return { id: "wk_test" };
  };
  workoutRepository.workoutRepository.applyWorkoutReward = async () => ({});

  // Database returns 80 for weight, but 60 (stale) for weight_kg
  pool.execute = async (sql, params) => {
    if (sql.includes("SELECT weight, weight_kg FROM users")) {
      return [[{ weight: 80, weight_kg: 60 }], []];
    }
    if (sql.includes("SELECT COALESCE(weekly_streak")) {
      return [[{ weekly_streak: 0 }], []];
    }
    if (sql.includes("FROM exercise_categories")) {
      return [[{ id: "cat_cardio", slug: "cardio", name: "Cardio Training", description: "Cardio", base_met: 3.5, xp_per_met_min: 0.2, is_custom: 0 }], []];
    }
    return [[], []];
  };

  try {
    await workoutService.createWorkout("usr_test", {
      activitySlug: "running",
      duration: 30,
      date: "2026-05-01"
    });

    assert.strictEqual(capturedWeight, 80, "Workout calculation should prioritize weight (80) over weight_kg (60)");
  } finally {
    pool.execute = originalExecute;
    workoutRepository.workoutRepository.createWorkout = originalCreateWorkout;
    workoutRepository.workoutRepository.applyWorkoutReward = originalApplyWorkoutReward;
    activityRepository.activityRepository.getActivityBySlug = originalGetActivityBySlug;
  }
});

test("workoutService.createCategoryWorkout prioritizes users.weight over users.weight_kg", async () => {
  const originalExecute = pool.execute;
  const originalCreateWorkout = require("../src/repositories/workoutRepository").workoutRepository?.createWorkout;
  const originalApplyWorkoutReward = require("../src/repositories/workoutRepository").workoutRepository?.applyWorkoutReward;

  let capturedWeight = null;
  const workoutRepository = require("../src/repositories/workoutRepository");
  workoutRepository.workoutRepository.createWorkout = async (workout) => {
    capturedWeight = workout.userWeightAtLog;
    return { id: "wk_test" };
  };
  workoutRepository.workoutRepository.applyWorkoutReward = async () => ({});

  // Database returns 80 for weight, but 60 (stale) for weight_kg
  pool.execute = async (sql, params) => {
    if (sql.includes("SELECT weight, weight_kg FROM users")) {
      return [[{ weight: 80, weight_kg: 60 }], []];
    }
    if (sql.includes("SELECT COALESCE(weekly_streak")) {
      return [[{ weekly_streak: 0 }], []];
    }
    if (sql.includes("FROM exercise_categories")) {
      return [[{ id: "cat_cardio", slug: "cardio", name: "Cardio Training", description: "Cardio", base_met: 3.5, xp_per_met_min: 0.2, is_custom: 0 }], []];
    }
    return [[], []];
  };

  try {
    await workoutService.createWorkout("usr_test", {
      category: "cardio",
      duration: 30,
      date: "2026-05-01",
      exercises: [
        { exerciseName: "Jogging", duration: 30 }
      ]
    });

    assert.strictEqual(capturedWeight, 80, "Workout calculation should prioritize weight (80) over weight_kg (60)");
  } finally {
    pool.execute = originalExecute;
    workoutRepository.workoutRepository.createWorkout = originalCreateWorkout;
    workoutRepository.workoutRepository.applyWorkoutReward = originalApplyWorkoutReward;
  }
});

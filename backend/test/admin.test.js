const test = require("node:test");
const assert = require("node:assert");
const pool = require("../src/config/db");
const { userRepository } = require("../src/repositories/userRepository");
const { adminService } = require("../src/services/adminService");
const { adminController } = require("../src/controllers/adminController");
const adminRoutes = require("../src/routes/adminRoutes");
const { requireAdmin } = require("../src/middleware/roleMiddleware");

test("userRepository.resetUserProfile updates the correct fields to NULL/defaults", async () => {
  const originalExecute = pool.execute;
  let executedSql = null;
  let executedParams = null;
  let getUserByIdCalled = false;

  pool.execute = async (sql, params) => {
    if (sql.includes("UPDATE users") && sql.includes("SET")) {
      executedSql = sql;
      executedParams = params;
      return [{ affectedRows: 1 }, []];
    }
    if (sql.includes("SELECT") && sql.includes("FROM users WHERE id = ?")) {
      getUserByIdCalled = true;
      return [[{ id: "usr_target", email: "target@fitsync.com", name: "Target User", role: "user" }], []];
    }
    if (sql.includes("SELECT") && sql.includes("FROM user_gamification")) {
      return [[{ total_xp: 100, level: 1, current_streak: 0, longest_streak: 0 }], []];
    }
    if (sql.includes("SELECT") && sql.includes("FROM workouts")) {
      return [[{ today_calories: 0, week_workouts: 0 }], []];
    }
    return [{ affectedRows: 1 }, []];
  };

  try {
    const result = await userRepository.resetUserProfile("usr_target");

    assert.ok(executedSql, "SQL UPDATE query should have been executed");
    assert.ok(executedSql.includes("age = NULL"), "SQL should set age to NULL");
    assert.ok(executedSql.includes("gender = NULL"), "SQL should set gender to NULL");
    assert.ok(executedSql.includes("height = NULL"), "SQL should set height to NULL");
    assert.ok(executedSql.includes("weight = NULL"), "SQL should set weight to NULL");
    assert.ok(executedSql.includes("weight_kg = NULL"), "SQL should set weight_kg to NULL");
    assert.ok(executedSql.includes("target_weight = NULL"), "SQL should set target_weight to NULL");
    assert.ok(executedSql.includes("preferred_workout_type = NULL"), "SQL should set preferred_workout_type to NULL");
    assert.ok(executedSql.includes("goal = 'Maintain fitness'"), "SQL should set goal to default");
    assert.ok(executedSql.includes("activity_level = 'Sedentary'"), "SQL should set activity_level to default");
    assert.deepStrictEqual(executedParams, ["usr_target"], "User ID param should be passed to WHERE clause");
    assert.ok(getUserByIdCalled, "getUserById should have been called after reset");
    assert.strictEqual(result.id, "usr_target", "Should return the reset user object");
  } finally {
    pool.execute = originalExecute;
  }
});

test("adminService.resetUserProfile throws 400 if admin tries to reset their own profile", async () => {
  const originalReset = userRepository.resetUserProfile;
  let repoCalled = false;

  userRepository.resetUserProfile = async () => {
    repoCalled = true;
    return {};
  };

  try {
    await assert.rejects(
      () => adminService.resetUserProfile("admin_id", "admin_id"),
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.message, "You cannot reset your own profile info through the admin console.");
        return true;
      }
    );
    assert.strictEqual(repoCalled, false, "Repository should not be called on self-reset");
  } finally {
    userRepository.resetUserProfile = originalReset;
  }
});

test("adminService.resetUserProfile throws 404 if target user is not found", async () => {
  const originalReset = userRepository.resetUserProfile;
  userRepository.resetUserProfile = async () => undefined;

  try {
    await assert.rejects(
      () => adminService.resetUserProfile("admin_id", "usr_nonexistent"),
      (err) => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, "User not found.");
        return true;
      }
    );
  } finally {
    userRepository.resetUserProfile = originalReset;
  }
});

test("adminService.resetUserProfile returns safe user object on success", async () => {
  const originalReset = userRepository.resetUserProfile;
  userRepository.resetUserProfile = async () => ({
    id: "usr_target",
    email: "target@fitsync.com",
    name: "Target User",
    passwordHash: "secret_hash"
  });

  try {
    const result = await adminService.resetUserProfile("admin_id", "usr_target");
    assert.strictEqual(result.id, "usr_target");
    assert.strictEqual(result.passwordHash, undefined, "Sensitive passwordHash should be removed");
  } finally {
    userRepository.resetUserProfile = originalReset;
  }
});

test("adminController.resetUserProfile maps params correctly and handles success", async () => {
  const originalServiceReset = adminService.resetUserProfile;
  let serviceArgs = null;

  adminService.resetUserProfile = async (adminId, userId) => {
    serviceArgs = { adminId, userId };
    return { id: userId, name: "Reset User" };
  };

  const req = {
    user: { id: "admin_id_1" },
    params: { id: "user_target_1" }
  };

  let responseData = null;
  const res = {
    json(data) {
      responseData = data;
    }
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  try {
    await adminController.resetUserProfile(req, res, next);
    assert.deepStrictEqual(serviceArgs, { adminId: "admin_id_1", userId: "user_target_1" });
    assert.deepStrictEqual(responseData, { id: "user_target_1", name: "Reset User" });
    assert.strictEqual(nextCalled, false);
  } finally {
    adminService.resetUserProfile = originalServiceReset;
  }
});

test("adminController.resetUserProfile passes error to next() on failure", async () => {
  const originalServiceReset = adminService.resetUserProfile;
  const dummyError = new Error("Database error");
  dummyError.status = 500;

  adminService.resetUserProfile = async () => {
    throw dummyError;
  };

  const req = {
    user: { id: "admin_id_1" },
    params: { id: "user_target_1" }
  };

  const res = {
    json() {}
  };

  let passedError = null;
  const next = (err) => {
    passedError = err;
  };

  try {
    await adminController.resetUserProfile(req, res, next);
    assert.strictEqual(passedError, dummyError);
  } finally {
    adminService.resetUserProfile = originalServiceReset;
  }
});

test("adminRoutes: reset-profile route is registered with POST method", () => {
  const route = adminRoutes.stack.find((layer) => {
    return layer.route && layer.route.path === "/users/:id/reset-profile";
  });
  assert.ok(route, "Route POST /users/:id/reset-profile should be registered in adminRoutes");
  assert.ok(route.route.methods.post, "reset-profile route should accept POST method");
});

test("requireAdmin middleware blocks non-admin role", () => {
  const req = {
    user: { id: "usr_1", role: "user" }
  };
  let statusCode = null;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  requireAdmin(req, res, next);

  assert.strictEqual(statusCode, 403);
  assert.strictEqual(responseData.error, "Admin privileges required.");
  assert.strictEqual(nextCalled, false);
});

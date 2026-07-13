const test = require("node:test");
const assert = require("node:assert");
const { userService } = require("../src/services/userService");
const { userRepository } = require("../src/repositories/userRepository");
const { profileController } = require("../src/controllers/profileController");
const profileRoutes = require("../src/routes/profileRoutes");

test("userService.resetProfile: calls userRepository.resetUserProfile and returns safe user", async () => {
  const originalResetUserProfile = userRepository.resetUserProfile;
  let resetUserId = null;

  userRepository.resetUserProfile = async (id) => {
    resetUserId = id;
    return {
      id: "usr_user1",
      email: "user1@fitsync.com",
      name: "User One",
      passwordHash: "some_secret_hash",
      age: null,
      gender: null,
      height: null,
      weight: null,
      target_weight: null,
      preferred_workout_type: null,
      goal: "Maintain fitness",
      activity_level: "Sedentary"
    };
  };

  try {
    const result = await userService.resetProfile("usr_user1");
    assert.strictEqual(resetUserId, "usr_user1");
    assert.strictEqual(result.id, "usr_user1");
    assert.strictEqual(result.passwordHash, undefined, "passwordHash must be stripped out");
    assert.strictEqual(result.email, "user1@fitsync.com");
  } finally {
    userRepository.resetUserProfile = originalResetUserProfile;
  }
});

test("userService.resetProfile: throws 404 error if user not found", async () => {
  const originalResetUserProfile = userRepository.resetUserProfile;
  userRepository.resetUserProfile = async () => undefined;

  try {
    await assert.rejects(
      () => userService.resetProfile("usr_nonexistent"),
      (err) => {
        assert.strictEqual(err.status, 404);
        assert.strictEqual(err.message, "User not found");
        return true;
      }
    );
  } finally {
    userRepository.resetUserProfile = originalResetUserProfile;
  }
});

test("profileController.resetProfile: maps params and writes JSON on success", async () => {
  const originalResetProfile = userService.resetProfile;
  let serviceUserId = null;

  userService.resetProfile = async (id) => {
    serviceUserId = id;
    return { id, name: "Reset User" };
  };

  const req = {
    user: { id: "usr_user2" }
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
    await profileController.resetProfile(req, res, next);
    assert.strictEqual(serviceUserId, "usr_user2");
    assert.deepStrictEqual(responseData, { id: "usr_user2", name: "Reset User" });
    assert.strictEqual(nextCalled, false);
  } finally {
    userService.resetProfile = originalResetProfile;
  }
});

test("profileController.resetProfile: passes error to next() on failure", async () => {
  const originalResetProfile = userService.resetProfile;
  const dummyError = new Error("Service error");
  dummyError.status = 500;

  userService.resetProfile = async () => {
    throw dummyError;
  };

  const req = {
    user: { id: "usr_user2" }
  };

  const res = {
    json() {}
  };

  let passedError = null;
  const next = (err) => {
    passedError = err;
  };

  try {
    await profileController.resetProfile(req, res, next);
    assert.strictEqual(passedError, dummyError);
  } finally {
    userService.resetProfile = originalResetProfile;
  }
});

test("profileRoutes: reset-profile route is registered with POST method", () => {
  const route = profileRoutes.stack.find((layer) => {
    return layer.route && layer.route.path === "/reset-profile";
  });
  assert.ok(route, "Route POST /reset-profile should be registered in profileRoutes");
  assert.ok(route.route.methods.post, "reset-profile route should accept POST method");
});

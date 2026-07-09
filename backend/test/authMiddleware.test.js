require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../src/config/jwt");
const { userRepository } = require("../src/repositories/userRepository");
const { authenticateToken } = require("../src/middleware/authMiddleware");

// Helper to run the auth middleware against a mock request and response
async function runAuthMiddleware(authHeader) {
  const req = {
    headers: {
      authorization: authHeader
    }
  };
  
  let statusCode = null;
  let responseData = null;
  let nextCalled = false;
  
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
  
  const next = () => {
    nextCalled = true;
  };
  
  await authenticateToken(req, res, next);
  
  return { req, statusCode, responseData, nextCalled };
}

test("authenticateToken: missing token returns 401", async () => {
  const { statusCode, responseData, nextCalled } = await runAuthMiddleware("");
  
  assert.strictEqual(statusCode, 401);
  assert.strictEqual(responseData.error, "Missing authentication token.");
  assert.strictEqual(nextCalled, false);
});

test("authenticateToken: invalid token returns 401", async () => {
  const { statusCode, responseData, nextCalled } = await runAuthMiddleware("Bearer invalid-token-string");
  
  assert.strictEqual(statusCode, 401);
  assert.strictEqual(responseData.error, "Invalid or expired authentication token.");
  assert.strictEqual(nextCalled, false);
});

test("authenticateToken: token for missing/deleted user returns 401", async () => {
  const originalGetUserById = userRepository.getUserById;
  // Mock userRepository.getUserById to return undefined (user does not exist)
  userRepository.getUserById = async () => undefined;
  
  const token = jwt.sign({ id: "missing-user-id", email: "test@test.com", role: "user" }, JWT_CONFIG.secret);
  
  try {
    const { statusCode, responseData, nextCalled } = await runAuthMiddleware(`Bearer ${token}`);
    
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(responseData.error, "Invalid or expired authentication token.");
    assert.strictEqual(nextCalled, false);
  } finally {
    userRepository.getUserById = originalGetUserById;
  }
});

test("authenticateToken: token for inactive user returns 403", async () => {
  const originalGetUserById = userRepository.getUserById;
  // Mock userRepository.getUserById to return an inactive user
  userRepository.getUserById = async () => ({
    id: "inactive-user-id",
    email: "inactive@test.com",
    role: "user",
    isActive: false
  });
  
  const token = jwt.sign({ id: "inactive-user-id", email: "inactive@test.com", role: "user" }, JWT_CONFIG.secret);
  
  try {
    const { statusCode, responseData, nextCalled } = await runAuthMiddleware(`Bearer ${token}`);
    
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(responseData.error, "This account has been deactivated. Please contact an administrator.");
    assert.strictEqual(nextCalled, false);
  } finally {
    userRepository.getUserById = originalGetUserById;
  }
});

test("authenticateToken: token for active user still passes and sets req.user", async () => {
  const originalGetUserById = userRepository.getUserById;
  // Mock userRepository.getUserById to return an active user
  userRepository.getUserById = async () => ({
    id: "active-user-id",
    email: "active@test.com",
    role: "user",
    isActive: true
  });
  
  const token = jwt.sign({ id: "active-user-id", email: "active@test.com", role: "user" }, JWT_CONFIG.secret);
  
  try {
    const { req, statusCode, nextCalled } = await runAuthMiddleware(`Bearer ${token}`);
    
    assert.strictEqual(statusCode, null); // 200/no error status set
    assert.strictEqual(nextCalled, true);
    assert.deepStrictEqual(req.user, {
      id: "active-user-id",
      email: "active@test.com",
      role: "user"
    });
  } finally {
    userRepository.getUserById = originalGetUserById;
  }
});

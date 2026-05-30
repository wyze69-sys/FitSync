/**
 * Auth / registration & login tests.
 *
 * Uses Node's built-in test runner (`node --test`) — no extra dependencies and
 * no database required. These cover the security-critical pieces of the auth
 * entry points: password hashing and request validation.
 *
 * Run: `npm test` (from the backend folder).
 */

const test = require("node:test");
const assert = require("node:assert");
const bcryptjs = require("bcryptjs");
const { validate } = require("../src/middleware/validate");
const { registerSchema, loginSchema } = require("../src/validation/schemas");

// Run a validate() middleware against a fake request and capture the outcome.
function runValidation(schema, body, source = "body") {
  const req = { [source]: body };
  let statusCode = 200;
  let payload = null;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };
  validate(schema, source)(req, res, () => {
    nextCalled = true;
  });
  return { statusCode, payload, nextCalled, req };
}

test("passwords are hashed with bcrypt and verify correctly", () => {
  const hash = bcryptjs.hashSync("fitness123", 10);
  assert.notStrictEqual(hash, "fitness123", "password must never be stored in plain text");
  assert.strictEqual(bcryptjs.compareSync("fitness123", hash), true);
  assert.strictEqual(bcryptjs.compareSync("wrong-password", hash), false);
});

test("register validation rejects an invalid email", () => {
  const { statusCode, nextCalled } = runValidation(registerSchema, {
    name: "Test User",
    email: "not-an-email",
    password: "password123"
  });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test("register validation rejects a password shorter than 8 characters", () => {
  const { statusCode, payload, nextCalled } = runValidation(registerSchema, {
    name: "Test User",
    email: "test@fitsync.com",
    password: "short"
  });
  assert.strictEqual(statusCode, 400);
  assert.match(payload.error, /password/i);
  assert.strictEqual(nextCalled, false);
});

test("register validation accepts valid input and normalizes the email", () => {
  const { statusCode, nextCalled, req } = runValidation(registerSchema, {
    name: "Test User",
    email: "  Test@FitSync.com ",
    password: "password123"
  });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(req.body.email, "test@fitsync.com");
});

test("login validation rejects a malformed email", () => {
  const { statusCode, nextCalled } = runValidation(loginSchema, {
    email: "bad",
    password: "whatever"
  });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

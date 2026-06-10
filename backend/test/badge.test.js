const test = require("node:test");
const assert = require("node:assert");
const { validate } = require("../src/middleware/validate");
const { badgeCreateSchema, badgeUpdateSchema } = require("../src/validation/schemas");
const { achievementService } = require("../src/services/achievementService");
const { achievementRepository } = require("../src/repositories/achievementRepository");

// Helper to run validate middleware against fake request
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

test("badgeCreateSchema validation rejects missing required fields", () => {
  const { statusCode, nextCalled } = runValidation(badgeCreateSchema, {
    code: "new_badge",
    // name is missing!
    description: "Badge for running",
    requirementType: "streak",
    requirementValue: 5
  });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test("badgeCreateSchema validation accepts valid input and sets defaults", () => {
  const { statusCode, nextCalled, req } = runValidation(badgeCreateSchema, {
    code: "new_badge",
    name: "Runner Badge",
    description: "Badge for running",
    requirementType: "streak",
    requirementValue: 5
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.body.isActive, true); // default
  assert.strictEqual(req.body.sortOrder, 0); // default
});

test("badgeUpdateSchema accepts partial updates", () => {
  const { statusCode, nextCalled } = runValidation(badgeUpdateSchema, {
    name: "Updated Runner Badge"
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
});

test("achievementService.getBadgeDetail throws 404 error if badge not found", async () => {
  const original = achievementRepository.getBadgeByCode;
  achievementRepository.getBadgeByCode = async () => null;

  try {
    await assert.rejects(
      () => achievementService.getBadgeDetail("missing_code"),
      (err) => err.status === 404 && err.message.includes("Badge not found")
    );
  } finally {
    achievementRepository.getBadgeByCode = original;
  }
});

test("achievementService.createBadge throws 400 if badge code already exists", async () => {
  const originalGet = achievementRepository.getBadgeByCode;
  achievementRepository.getBadgeByCode = async () => ({ code: "existing_code" });

  try {
    await assert.rejects(
      () => achievementService.createBadge({ code: "existing_code" }),
      (err) => err.status === 400 && err.message.includes("already exists")
    );
  } finally {
    achievementRepository.getBadgeByCode = originalGet;
  }
});

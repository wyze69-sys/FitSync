const test = require("node:test");
const assert = require("node:assert");
const { validate } = require("../src/middleware/validate");
const { challengeCreateSchema, challengeUpdateSchema, challengeStatusSchema } = require("../src/validation/schemas");
const { challengeService } = require("../src/services/challengeService");
const { challengeRepository } = require("../src/repositories/challengeRepository");

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

test("challengeCreateSchema validation rejects missing title, challengeType, targetValue, startDate or endDate", () => {
  const { statusCode, nextCalled } = runValidation(challengeCreateSchema, {
    description: "Walk 10000 steps daily",
    challengeType: "steps",
    targetValue: 10000,
    startDate: "2026-06-01"
    // endDate is missing!
  });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test("challengeCreateSchema validation accepts valid input and sets defaults", () => {
  const { statusCode, nextCalled, req } = runValidation(challengeCreateSchema, {
    title: "Step Master",
    description: "Walk 10000 steps daily",
    challengeType: "steps",
    targetValue: 10000,
    startDate: "2026-06-01",
    endDate: "2026-06-07"
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.body.isActive, true); // default
  assert.strictEqual(req.body.rewardXp, 0); // default
});

test("challengeUpdateSchema accepts partial updates", () => {
  const { statusCode, nextCalled } = runValidation(challengeUpdateSchema, {
    title: "New Challenge Title"
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
});

test("challengeStatusSchema rejects invalid or missing isActive", () => {
  const { statusCode, nextCalled } = runValidation(challengeStatusSchema, {
    // isActive is missing!
  });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test("challengeService.getChallengeById throws 404 error if challenge not found", async () => {
  const original = challengeRepository.getChallengeById;
  challengeRepository.getChallengeById = async () => null;

  try {
    await assert.rejects(
      () => challengeService.getChallengeById("missing_id"),
      (err) => err.status === 404 && err.message.includes("not found")
    );
  } finally {
    challengeRepository.getChallengeById = original;
  }
});

test("challengeService.createChallenge rejects non-existent badgeCode with 400 error", async () => {
  const originalExists = challengeRepository.achievementExists;
  challengeRepository.achievementExists = async () => false;

  try {
    await assert.rejects(
      () => challengeService.createChallenge({
        title: "Test",
        description: "Test description",
        challengeType: "cardio",
        targetValue: 50,
        startDate: "2026-06-01",
        endDate: "2026-06-07",
        badgeCode: "invalid_badge"
      }),
      (err) => err.status === 400 && err.message.includes("does not exist")
    );
  } finally {
    challengeRepository.achievementExists = originalExists;
  }
});

test("challengeService.updateChallenge throws 404 error if challenge not found", async () => {
  const originalGet = challengeRepository.getChallengeById;
  challengeRepository.getChallengeById = async () => null;

  try {
    await assert.rejects(
      () => challengeService.updateChallenge("missing_id", { title: "New Title" }),
      (err) => err.status === 404
    );
  } finally {
    challengeRepository.getChallengeById = originalGet;
  }
});

test("challengeService.updateChallenge rejects non-existent badgeCode with 400 error", async () => {
  const originalGet = challengeRepository.getChallengeById;
  const originalExists = challengeRepository.achievementExists;
  challengeRepository.getChallengeById = async () => ({ id: "chg_1" });
  challengeRepository.achievementExists = async () => false;

  try {
    await assert.rejects(
      () => challengeService.updateChallenge("chg_1", { badgeCode: "invalid_badge" }),
      (err) => err.status === 400 && err.message.includes("does not exist")
    );
  } finally {
    challengeRepository.getChallengeById = originalGet;
    challengeRepository.achievementExists = originalExists;
  }
});

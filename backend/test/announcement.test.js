const test = require("node:test");
const assert = require("node:assert");
const { validate } = require("../src/middleware/validate");
const { announcementCreateSchema, announcementUpdateSchema, statusUpdateSchema } = require("../src/validation/schemas");
const { announcementService } = require("../src/services/announcementService");
const { announcementRepository } = require("../src/repositories/announcementRepository");

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

test("announcementCreateSchema validation rejects missing title or body", () => {
  const { statusCode, nextCalled } = runValidation(announcementCreateSchema, {
    audience: "users"
    // title and body are missing!
  });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test("announcementCreateSchema validation accepts valid input and sets defaults", () => {
  const { statusCode, nextCalled, req } = runValidation(announcementCreateSchema, {
    title: "New Update",
    body: "FitSync v1.1 is out!",
    audience: "users"
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.body.isActive, true); // default
  assert.strictEqual(req.body.placement, "dashboard"); // default
});

test("announcementUpdateSchema accepts partial updates", () => {
  const { statusCode, nextCalled } = runValidation(announcementUpdateSchema, {
    title: "Updated Title"
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
});

test("announcementService.getAnnouncementById throws 404 error if not found", async () => {
  const original = announcementRepository.getAnnouncementById;
  announcementRepository.getAnnouncementById = async () => null;

  try {
    await assert.rejects(
      () => announcementService.getAnnouncementById("missing_id"),
      (err) => err.status === 404 && err.message.includes("not found")
    );
  } finally {
    announcementRepository.getAnnouncementById = original;
  }
});

test("announcementService.createAnnouncement rejects invalid startAt date format", async () => {
  try {
    await assert.rejects(
      () => announcementService.createAnnouncement({
        title: "Test",
        body: "Body text",
        audience: "users",
        startAt: "invalid-date-format"
      }),
      (err) => err.status === 400 && err.message.includes("Invalid startAt")
    );
  } finally {
  }
});

test("announcementService.createAnnouncement rejects startAt > endAt", async () => {
  try {
    await assert.rejects(
      () => announcementService.createAnnouncement({
        title: "Test",
        body: "Body text",
        audience: "users",
        startAt: "2026-06-12 10:00:00",
        endAt: "2026-06-10 10:00:00"
      }),
      (err) => err.status === 400 && err.message.includes("before or equal")
    );
  } finally {
  }
});

test("announcementService.getActiveAnnouncements respects userRole filtering", async () => {
  const original = announcementRepository.getActiveAnnouncements;
  let passedAudiences = [];
  announcementRepository.getActiveAnnouncements = async (audiences, nowStr) => {
    passedAudiences = audiences;
    return [];
  };

  try {
    // Standard User
    await announcementService.getActiveAnnouncements("user");
    assert.deepStrictEqual(passedAudiences, ["all", "users"]);

    // Admin User
    await announcementService.getActiveAnnouncements("admin");
    assert.deepStrictEqual(passedAudiences, ["all", "admins"]);
  } finally {
    announcementRepository.getActiveAnnouncements = original;
  }
});

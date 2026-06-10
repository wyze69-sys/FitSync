const test = require("node:test");
const assert = require("node:assert");
const { validate } = require("../src/middleware/validate");
const { templateCreateSchema, templateUpdateSchema, templateStatusSchema } = require("../src/validation/schemas");
const { templateService } = require("../src/services/templateService");
const { templateRepository } = require("../src/repositories/templateRepository");

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

test("templateCreateSchema validation rejects missing title or categoryName", () => {
  const { statusCode, nextCalled } = runValidation(templateCreateSchema, {
    description: "My template",
    categoryId: "cat_cardio",
    // categoryName is missing!
    exercises: [{ exerciseName: "Jogging", duration: 30 }]
  });
  assert.strictEqual(statusCode, 400);
  assert.strictEqual(nextCalled, false);
});

test("templateCreateSchema validation accepts valid input and sets defaults", () => {
  const { statusCode, nextCalled, req } = runValidation(templateCreateSchema, {
    title: "Cardio Starter",
    description: "Beginner jogging template",
    categoryId: "cat_cardio",
    categoryName: "Cardio",
    exercises: [{ exerciseName: "Jogging", duration: 30 }]
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.body.isActive, true); // default
  assert.strictEqual(req.body.durationMin, 30); // default
  assert.strictEqual(req.body.sortOrder, 0); // default
});

test("templateUpdateSchema accepts partial updates", () => {
  const { statusCode, nextCalled } = runValidation(templateUpdateSchema, {
    title: "Updated Title"
  });
  assert.strictEqual(statusCode, 200);
  assert.strictEqual(nextCalled, true);
});

test("templateService.getTemplateById throws 404 error if template not found", async () => {
  const original = templateRepository.getTemplateById;
  templateRepository.getTemplateById = async () => null;

  try {
    await assert.rejects(
      () => templateService.getTemplateById("missing_id"),
      (err) => err.status === 404 && err.message.includes("not found")
    );
  } finally {
    templateRepository.getTemplateById = original;
  }
});

test("templateService.deleteTemplate throws 404 if delete returns false", async () => {
  const original = templateRepository.deleteTemplate;
  templateRepository.deleteTemplate = async () => false;

  try {
    await assert.rejects(
      () => templateService.deleteTemplate("tpl_1"),
      (err) => err.status === 404
    );
  } finally {
    templateRepository.deleteTemplate = original;
  }
});

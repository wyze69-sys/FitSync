/**
 * Centralized request validation schemas.
 * Each schema is consumed by the `validate` middleware and keeps controllers
 * and services free of repetitive manual checks.
 */

const GENDERS = ["male", "female", "other"];
const ACTIVITY_LEVELS = ["Sedentary", "Lightly active", "Moderately active", "Very active"];

const registerSchema = {
  name: { type: "string", required: true, minLength: 2, maxLength: 255 },
  email: { type: "email", required: true },
  password: { type: "string", required: true, minLength: 8, maxLength: 128, trim: false }
};

const loginSchema = {
  email: { type: "email", required: true },
  password: { type: "string", required: true, maxLength: 128, trim: false }
};

const profileUpdateSchema = {
  name: { type: "string", maxLength: 255 },
  age: { type: "integer", min: 1, max: 120 },
  gender: { type: "string", enum: GENDERS },
  height: { type: "number", min: 50, max: 280 },
  weight: { type: "number", min: 20, max: 500 },
  targetWeight: { type: "number", min: 20, max: 500 },
  preferredWorkoutType: { type: "string", maxLength: 50 },
  goal: { type: "string", maxLength: 255 },
  activityLevel: { type: "string", enum: ACTIVITY_LEVELS }
};

const workoutBodySchema = {
  date: { type: "date" },
  title: { type: "string", minLength: 2, maxLength: 255 },
  notes: { type: "string", maxLength: 2000 },
  category: { type: "string", maxLength: 80 },
  categorySlug: { type: "string", maxLength: 80 },
  duration_min: { type: "number", min: 1, max: 1440 },
  durationMin: { type: "number", min: 1, max: 1440 },
  distance_km: { type: "number", min: 0, max: 1000 },
  distanceKm: { type: "number", min: 0, max: 1000 },
  user_weight: { type: "number", min: 20, max: 500 },
  userWeight: { type: "number", min: 20, max: 500 },
  exercises: { type: "array", minLength: 1, maxLength: 50 }
};

const workoutQuerySchema = {
  category: { type: "string", maxLength: 50 },
  search: { type: "string", maxLength: 100 },
  from: { type: "date" },
  to: { type: "date" },
  sort: {
    type: "string",
    enum: ["date_desc", "date_asc", "calories_desc", "duration_desc"],
    default: "date_desc"
  },
  page: { type: "integer", min: 1, default: 1 },
  limit: { type: "integer", min: 1, max: 100, default: 50 }
};

const weightLogSchema = {
  date: { type: "date", required: true },
  weight: { type: "number", required: true, min: 20, max: 500 },
  notes: { type: "string", maxLength: 2000 }
};

const categorySchema = {
  name: { type: "string", required: true, minLength: 2, maxLength: 255 },
  description: { type: "string", required: true, minLength: 2, maxLength: 1000 }
};

const categoryUpdateSchema = {
  name: { type: "string", minLength: 2, maxLength: 255 },
  description: { type: "string", required: true, minLength: 2, maxLength: 1000 }
};

const checkinSchema = {
  type: { type: "string", maxLength: 50, default: "Wellness check-in" }
};

const roleUpdateSchema = {
  role: { type: "string", required: true, enum: ["user", "admin"] }
};

const statusUpdateSchema = {
  isActive: { type: "boolean", required: true }
};

const adminUserQuerySchema = {
  search: { type: "string", maxLength: 100 },
  role: { type: "string", enum: ["user", "admin"] },
  status: { type: "string", enum: ["active", "inactive"] }
};

const templateCreateSchema = {
  title: { type: "string", required: true, minLength: 2, maxLength: 255 },
  description: { type: "string", required: true, maxLength: 2000 },
  categoryId: { type: "string", maxLength: 50 },
  categoryName: { type: "string", required: true, maxLength: 255 },
  subtype: { type: "string", maxLength: 255 },
  durationMin: { type: "integer", min: 1, max: 1440, default: 30 },
  exercises: { type: "array", required: true, minLength: 1, maxLength: 50 },
  isActive: { type: "boolean", default: true },
  sortOrder: { type: "integer", default: 0 }
};

const templateUpdateSchema = {
  title: { type: "string", minLength: 2, maxLength: 255 },
  description: { type: "string", maxLength: 2000 },
  categoryId: { type: "string", maxLength: 50 },
  categoryName: { type: "string", maxLength: 255 },
  subtype: { type: "string", maxLength: 255 },
  durationMin: { type: "integer", min: 1, max: 1440 },
  exercises: { type: "array", minLength: 1, maxLength: 50 },
  isActive: { type: "boolean" },
  sortOrder: { type: "integer" }
};

const templateStatusSchema = {
  isActive: { type: "boolean", required: true }
};

const badgeCreateSchema = {
  code: { type: "string", required: true, minLength: 1, maxLength: 50 },
  name: { type: "string", required: true, minLength: 1, maxLength: 255 },
  description: { type: "string", required: true, minLength: 1, maxLength: 500 },
  requirementType: { type: "string", required: true, minLength: 1, maxLength: 30 },
  requirementValue: { type: "integer", required: true, min: 0 },
  icon: { type: "string", maxLength: 80 },
  sortOrder: { type: "integer", default: 0 },
  isActive: { type: "boolean", default: true }
};

const badgeUpdateSchema = {
  name: { type: "string", minLength: 1, maxLength: 255 },
  description: { type: "string", minLength: 1, maxLength: 500 },
  requirementType: { type: "string", minLength: 1, maxLength: 30 },
  requirementValue: { type: "integer", min: 0 },
  icon: { type: "string", maxLength: 80 },
  sortOrder: { type: "integer" },
  isActive: { type: "boolean" }
};

const challengeCreateSchema = {
  title: { type: "string", required: true, minLength: 2, maxLength: 255 },
  description: { type: "string", required: true, maxLength: 2000 },
  challengeType: { type: "string", required: true, minLength: 1, maxLength: 50 },
  targetValue: { type: "integer", required: true, min: 1 },
  startDate: { type: "date", required: true },
  endDate: { type: "date", required: true },
  rewardXp: { type: "integer", default: 0, min: 0 },
  badgeCode: { type: "string", maxLength: 50 },
  isActive: { type: "boolean", default: true }
};

const challengeUpdateSchema = {
  title: { type: "string", minLength: 2, maxLength: 255 },
  description: { type: "string", maxLength: 2000 },
  challengeType: { type: "string", minLength: 1, maxLength: 50 },
  targetValue: { type: "integer", min: 1 },
  startDate: { type: "date" },
  endDate: { type: "date" },
  rewardXp: { type: "integer", min: 0 },
  badgeCode: { type: "string", maxLength: 50 },
  isActive: { type: "boolean" }
};

const challengeStatusSchema = {
  isActive: { type: "boolean", required: true }
};

const announcementCreateSchema = {
  title: { type: "string", required: true, minLength: 2, maxLength: 255 },
  body: { type: "string", required: true, minLength: 2 },
  audience: { type: "string", enum: ["all", "users", "admins"], default: "users" },
  placement: { type: "string", maxLength: 50, default: "dashboard" },
  startAt: { type: "string" },
  endAt: { type: "string" },
  isActive: { type: "boolean", default: true }
};

const announcementUpdateSchema = {
  title: { type: "string", minLength: 2, maxLength: 255 },
  body: { type: "string", minLength: 2 },
  audience: { type: "string", enum: ["all", "users", "admins"] },
  placement: { type: "string", maxLength: 50 },
  startAt: { type: "string" },
  endAt: { type: "string" },
  isActive: { type: "boolean" }
};

const feedbackCreateSchema = {
  type: { type: "string", required: true, enum: ["bug", "feature", "general"] },
  subject: { type: "string", maxLength: 255 },
  message: { type: "string", required: true, minLength: 1, maxLength: 5000 }
};

const feedbackQuerySchema = {
  status: { type: "string", enum: ["new", "in_progress", "resolved", "archived"] },
  type: { type: "string", enum: ["bug", "feature", "general"] }
};

const feedbackUpdateSchema = {
  status: { type: "string", enum: ["new", "in_progress", "resolved", "archived"] },
  adminNote: { type: "string", maxLength: 2000 }
};

module.exports = {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  workoutBodySchema,
  workoutQuerySchema,
  weightLogSchema,
  categorySchema,
  categoryUpdateSchema,
  checkinSchema,
  roleUpdateSchema,
  statusUpdateSchema,
  adminUserQuerySchema,
  templateCreateSchema,
  templateUpdateSchema,
  templateStatusSchema,
  badgeCreateSchema,
  badgeUpdateSchema,
  challengeCreateSchema,
  challengeUpdateSchema,
  challengeStatusSchema,
  announcementCreateSchema,
  announcementUpdateSchema,
  feedbackCreateSchema,
  feedbackQuerySchema,
  feedbackUpdateSchema
};

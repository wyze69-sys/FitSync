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
  adminUserQuerySchema
};

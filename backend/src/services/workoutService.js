const pool = require("../config/db");
const { workoutRepository } = require("../repositories/workoutRepository");
const { gamificationService } = require("./gamificationService");
const { calculateCalories, calculateXP, getCategorySlug } = require("../utils/calculators");
const { createId } = require("../utils/ids");

/**
 * Creates a controller-friendly HTTP error.
 * @param {string} message Human-readable message.
 * @param {number} status HTTP status code.
 * @returns {Error}
 */
function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Normalizes client-provided exercises while ignoring untrusted calories and XP.
 * @param {Array<object>} exercises Raw exercises.
 * @param {object} categoryMeta Category metadata.
 * @param {number} calories Server-calculated workout calories.
 * @returns {Array<object>}
 */
function normalizeExercises(exercises, categoryMeta, calories) {
  return exercises.map((exercise, index) => ({
    id: exercise.id || createId("ex"),
    categoryId: exercise.categoryId || categoryMeta?.id || "cat_cardio",
    categoryName: exercise.categoryName || categoryMeta?.name || "Cardio",
    exerciseName: exercise.exerciseName || exercise.name || `Exercise ${index + 1}`,
    duration: Number(exercise.duration) || 0,
    caloriesBurned: index === 0 ? calories : 0,
    sets: (exercise.sets || []).map((set) => ({
      reps: Number(set.reps) || 0,
      weight: Number(set.weight) || 0
    }))
  }));
}

/**
 * Resolves the category to use for a full workout payload.
 * @param {object} workoutData Workout payload.
 * @returns {string}
 */
function resolveWorkoutCategory(workoutData) {
  const explicit = getCategorySlug(workoutData);
  if (explicit) return explicit;
  return workoutData.exercises?.[0]?.categorySlug || workoutData.exercises?.[0]?.categoryId || "cardio";
}

const workoutService = {
  async getWorkoutsByUserId(userId, filters = {}) {
    return workoutRepository.getWorkoutsByUserId(userId, filters);
  },

  async createWorkout(userId, workoutData) {
    const { date, title, notes } = workoutData;
    const sourceExercises = Array.isArray(workoutData.exercises) ? workoutData.exercises : [];

    if (!date) {
      throw httpError("Workout date is required.", 400);
    }

    const categorySlug = resolveWorkoutCategory(workoutData);
    const categoryMeta = await gamificationService.getCategoryMeta(categorySlug);
    if (!categoryMeta) {
      throw httpError("Choose a supported workout category.", 400);
    }

    const durationTotal = Number(
      workoutData.duration_min ??
        workoutData.durationMin ??
        sourceExercises.reduce((sum, exercise) => sum + Number(exercise.duration || 0), 0)
    );
    if (durationTotal <= 0) {
      throw httpError("Duration must be greater than zero.", 400);
    }

    const [[userRow]] = await pool.execute("SELECT weight, weight_kg FROM users WHERE id = ?", [userId]);
    const weightKg = Number(userRow?.weight_kg || userRow?.weight || 70);
    const calculationPayload = { ...workoutData, category: categoryMeta.slug, duration_min: durationTotal };
    const calories = calculateCalories(calculationPayload, weightKg, { categoryMeta });
    const xp = calculateXP(calculationPayload, { categoryMeta });
    const workoutTitle = title || categoryMeta.name;
    const exercises = normalizeExercises(
      sourceExercises.length > 0
        ? sourceExercises
        : [{ exerciseName: workoutTitle, duration: durationTotal, categoryId: categoryMeta.id }],
      categoryMeta,
      calories
    );

    const createdWorkout = await workoutRepository.createWorkout({
      userId,
      date,
      title: workoutTitle,
      notes,
      durationTotal,
      caloriesTotal: calories,
      caloriesBurned: calories,
      calories,
      xp,
      intensity: workoutData.intensity || "med",
      userWeightAtLog: weightKg,
      exercises
    });

    const reward = await workoutRepository.applyWorkoutReward(userId, createdWorkout.id, xp);
    return { ...createdWorkout, xp, calories, reward };
  },

  async updateWorkout(userId, workoutId, { date, title, notes, exercises }) {
    if (!Array.isArray(exercises) || exercises.length === 0) {
      throw httpError("At least one exercise is required.", 400);
    }

    const existingWorkout = await workoutRepository.getWorkoutById(workoutId);
    if (!existingWorkout || existingWorkout.userId !== userId) {
      throw httpError("Workout record not found.", 404);
    }

    const normalizedExercises = normalizeExercises(exercises, null, 0);
    const durationTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.duration, 0);
    const caloriesTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.caloriesBurned, 0);

    return workoutRepository.updateWorkout(workoutId, {
      date: date || existingWorkout.date,
      title: title || existingWorkout.title,
      notes: notes !== undefined ? notes : existingWorkout.notes,
      durationTotal,
      caloriesTotal,
      exercises: normalizedExercises
    });
  },

  async deleteWorkout(userId, workoutId) {
    const deleted = await workoutRepository.deleteWorkout(workoutId, userId);
    if (!deleted) {
      throw httpError("Workout record not found.", 404);
    }
    return { success: true, message: "Workout deleted successfully." };
  }
};

module.exports = { workoutService };

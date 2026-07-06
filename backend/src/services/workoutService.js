const pool = require("../config/db");
const { workoutRepository } = require("../repositories/workoutRepository");
const { activityRepository } = require("../repositories/activityRepository");
const { gamificationService } = require("./gamificationService");
const {
  calculateCalories,
  calculateXpBreakdown,
  bodyweightFactorForName,
  getCategorySlug
} = require("../utils/calculators");
const { computeActivityWorkout, validateActivityInputs } = require("../utils/activityCalculator");
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
    activityId: exercise.activityId || null,
    activitySlug: exercise.activitySlug || null,
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
    const { date } = workoutData;

    if (!date) {
      throw httpError("Workout date is required.", 400);
    }

    // Activity-library path: a specific activity was selected (preferred flow).
    const activityKey =
      workoutData.activitySlug ||
      workoutData.activityId ||
      workoutData.exercises?.[0]?.activitySlug ||
      workoutData.exercises?.[0]?.activityId;
    if (activityKey) {
      return this.createActivityWorkout(userId, workoutData, activityKey);
    }

    return this.createCategoryWorkout(userId, workoutData);
  },

  /**
   * Logs a workout from a selected activity-library record. The activity's
   * metadata drives MET, calorie method, and XP performance bonus. Falls back
   * to the category flow when the slug is unknown so old clients keep working.
   */
  async createActivityWorkout(userId, workoutData, activityKey) {
    const activity = await activityRepository.getActivityBySlug(activityKey);
    if (!activity) {
      // Unknown slug — degrade gracefully to category-based logging.
      return this.createCategoryWorkout(userId, workoutData);
    }

    const inputs = {
      duration_min: workoutData.duration_min ?? workoutData.durationMin ?? workoutData.duration,
      distance_km: workoutData.distance_km ?? workoutData.distanceKm,
      sets: workoutData.sets,
      reps: workoutData.reps,
      weight: workoutData.weight,
      holdTime: workoutData.holdTime ?? workoutData.hold_time,
      intensity: workoutData.intensity || "med"
    };

    const validationError = validateActivityInputs(activity, inputs);
    if (validationError) {
      throw httpError(validationError, 400);
    }

    const categoryMeta = await gamificationService.getCategoryMeta(activity.categorySlug);

    const [[userRow]] = await pool.execute("SELECT weight, weight_kg FROM users WHERE id = ?", [userId]);
    const weightKg = Number(userRow?.weight_kg || userRow?.weight || 70);

    const [[gamRow]] = await pool.execute(
      "SELECT COALESCE(weekly_streak, 0) AS weekly_streak FROM user_gamification WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const weeklyStreak = Number(gamRow?.weekly_streak || 0);

    const result = computeActivityWorkout(activity, inputs, weightKg, { weeklyStreak });
    const calories = result.calories;
    const xpBreakdown = result.xpBreakdown;
    const xp = xpBreakdown.finalXp;
    const durationTotal = Math.max(1, Math.round(result.durationMin));
    const workoutTitle = workoutData.title || activity.name;

    // Persist a single exercise tied to the activity, plus its sets when present.
    const sets = [];
    const setCount = Number(workoutData.sets) || 0;
    const reps = Number(workoutData.reps) || 0;
    const weight = Number(workoutData.weight) || 0;
    if (activity.calorieMethod === "strength_volume" && setCount > 0 && reps > 0) {
      for (let i = 0; i < setCount; i += 1) sets.push({ reps, weight });
    } else if (reps > 0) {
      sets.push({ reps, weight: weight || 0 });
    }

    const exercises = [
      {
        id: createId("ex"),
        categoryId: activity.categoryId || categoryMeta?.id || null,
        categoryName: categoryMeta?.name || activity.categorySlug,
        activityId: activity.id,
        activitySlug: activity.slug,
        exerciseName: activity.name,
        duration: durationTotal,
        caloriesBurned: calories,
        sets
      }
    ];

    const createdWorkout = await workoutRepository.createWorkout({
      userId,
      date: workoutData.date,
      title: workoutTitle,
      notes: workoutData.notes,
      durationTotal,
      caloriesTotal: calories,
      caloriesBurned: calories,
      calories,
      xp,
      intensity: workoutData.intensity || "med",
      userWeightAtLog: weightKg,
      exercises
    });

    const reward = await workoutRepository.applyWorkoutReward(userId, createdWorkout.id, xp, {
      ...xpBreakdown,
      activitySlug: activity.slug,
      calories
    });
    return {
      ...createdWorkout,
      xp,
      calories,
      xpBreakdown,
      activity: { slug: activity.slug, name: activity.name },
      reward
    };
  },

  async createCategoryWorkout(userId, workoutData) {
    const { date, title, notes } = workoutData;
    const sourceExercises = Array.isArray(workoutData.exercises) ? workoutData.exercises : [];

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

    // Aggregate strength volume and reps from the logged sets (PDF s.3.2/4).
    let totalVolumeKg = 0;
    let totalReps = 0;
    let bodyweightFactor = null;
    for (const exercise of sourceExercises) {
      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      for (const set of sets) {
        const reps = Number(set.reps) || 0;
        const weight = Number(set.weight) || 0;
        totalReps += reps;
        totalVolumeKg += reps * weight;
      }
      if (bodyweightFactor === null) {
        bodyweightFactor = bodyweightFactorForName(exercise.exerciseName || exercise.name);
      }
    }

    // Weekly streak drives the XP streak bonus (PDF s.4/6).
    const [[gamRow]] = await pool.execute(
      "SELECT COALESCE(weekly_streak, 0) AS weekly_streak FROM user_gamification WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const weeklyStreak = Number(gamRow?.weekly_streak || 0);

    const calculationPayload = { ...workoutData, category: categoryMeta.slug, duration_min: durationTotal };
    const calories = calculateCalories(calculationPayload, weightKg, { categoryMeta, totalVolumeKg });
    const xpBreakdown = calculateXpBreakdown(calculationPayload, {
      categoryMeta,
      weeklyStreak,
      totalVolumeKg,
      reps: totalReps,
      ...(bodyweightFactor !== null ? { bodyweightFactor } : {})
    });
    const xp = xpBreakdown.finalXp;
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

    const reward = await workoutRepository.applyWorkoutReward(userId, createdWorkout.id, xp, xpBreakdown);
    return { ...createdWorkout, xp, calories, xpBreakdown, reward };
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

const { workoutRepository } = require("../repositories/workoutRepository");
const { createId } = require("../utils/ids");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function normalizeExercises(exercises) {
  return exercises.map((exercise) => ({
    id: exercise.id || createId("ex"),
    categoryId: exercise.categoryId || "cat_1",
    categoryName: exercise.categoryName || "Cardio Training",
    exerciseName: exercise.exerciseName || "General Exercise",
    duration: Number(exercise.duration) || 0,
    caloriesBurned: Number(exercise.caloriesBurned) || 0,
    sets: (exercise.sets || []).map((set) => ({
      reps: Number(set.reps) || 0,
      weight: Number(set.weight) || 0
    }))
  }));
}

const workoutService = {
  async getWorkoutsByUserId(userId, filters = {}) {
    return workoutRepository.getWorkoutsByUserId(userId, filters);
  },

  async createWorkout(userId, { date, title, notes, exercises }) {
    if (!date || !title || !Array.isArray(exercises) || exercises.length === 0) {
      throw httpError("Workout title, date, and at least one exercise are required.", 400);
    }

    const normalizedExercises = normalizeExercises(exercises);
    const durationTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.duration, 0);
    const caloriesTotal = normalizedExercises.reduce(
      (sum, exercise) => sum + exercise.caloriesBurned,
      0
    );

    return workoutRepository.createWorkout({
      userId,
      date,
      title,
      notes,
      durationTotal,
      caloriesTotal,
      exercises: normalizedExercises
    });
  },

  async updateWorkout(userId, workoutId, { date, title, notes, exercises }) {
    if (!Array.isArray(exercises) || exercises.length === 0) {
      throw httpError("At least one exercise is required.", 400);
    }

    const existingWorkout = await workoutRepository.getWorkoutById(workoutId);
    if (!existingWorkout || existingWorkout.userId !== userId) {
      throw httpError("Workout record not found.", 404);
    }

    const normalizedExercises = normalizeExercises(exercises);
    const durationTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.duration, 0);
    const caloriesTotal = normalizedExercises.reduce(
      (sum, exercise) => sum + exercise.caloriesBurned,
      0
    );

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

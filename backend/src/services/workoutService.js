const { workoutRepository } = require("../repositories/workoutRepository");

function normalizeExercises(exercises) {
  return exercises.map((exercise, index) => ({
    id: exercise.id || `ex_${index}_${Date.now()}`,
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
  async getWorkoutsByUserId(userId) {
    return workoutRepository.getWorkoutsByUserId(userId);
  },

  async createWorkout(userId, { date, title, notes, exercises }) {
    if (!date || !title || !Array.isArray(exercises)) {
      const err = new Error("Workout title, date, and exercise arrays are required.");
      err.status = 400;
      throw err;
    }

    const normalizedExercises = normalizeExercises(exercises);
    const durationTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.duration, 0);
    const caloriesTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.caloriesBurned, 0);

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
    if (!Array.isArray(exercises)) {
      const err = new Error("Exercise array is required.");
      err.status = 400;
      throw err;
    }

    const existingWorkout = await workoutRepository.getWorkoutById(workoutId);
    if (!existingWorkout || existingWorkout.userId !== userId) {
      const err = new Error("Workout record not found or unauthorized.");
      err.status = 404;
      throw err;
    }

    const normalizedExercises = normalizeExercises(exercises);
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
    const existingWorkout = await workoutRepository.getWorkoutById(workoutId);
    if (!existingWorkout || existingWorkout.userId !== userId) {
      const err = new Error("Workout record not found or access denied.");
      err.status = 404;
      throw err;
    }

    await workoutRepository.deleteWorkout(workoutId);
    return { success: true, message: "Workout log deleted successfully." };
  }
};

module.exports = { workoutService };

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

const workoutController = {
  async getWorkouts(req, res, next) {
    try {
      const workouts = await workoutRepository.getWorkoutsByUserId(req.user.id);
      res.json(workouts);
    } catch (err) {
      next(err);
    }
  },

  async createWorkout(req, res, next) {
    try {
      const { date, title, notes, exercises } = req.body;

      if (!date || !title || !Array.isArray(exercises)) {
        res.status(400).json({ error: "Workout title, date, and exercise arrays are required." });
        return;
      }

      const normalizedExercises = normalizeExercises(exercises);
      const durationTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.duration, 0);
      const caloriesTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.caloriesBurned, 0);

      const newWorkout = await workoutRepository.createWorkout({
        userId: req.user.id,
        date,
        title,
        notes,
        durationTotal,
        caloriesTotal,
        exercises: normalizedExercises
      });

      res.status(201).json(newWorkout);
    } catch (err) {
      next(err);
    }
  },

  async updateWorkout(req, res, next) {
    try {
      const { id } = req.params;
      const { date, title, notes, exercises } = req.body;

      if (!Array.isArray(exercises)) {
        res.status(400).json({ error: "Exercise array is required." });
        return;
      }

      const existingWorkout = await workoutRepository.getWorkoutById(id);
      if (!existingWorkout || existingWorkout.userId !== req.user.id) {
        res.status(404).json({ error: "Workout record not found or unauthorized." });
        return;
      }

      const normalizedExercises = normalizeExercises(exercises);
      const durationTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.duration, 0);
      const caloriesTotal = normalizedExercises.reduce((sum, exercise) => sum + exercise.caloriesBurned, 0);

      const updated = await workoutRepository.updateWorkout(id, {
        date: date || existingWorkout.date,
        title: title || existingWorkout.title,
        notes: notes !== undefined ? notes : existingWorkout.notes,
        durationTotal,
        caloriesTotal,
        exercises: normalizedExercises
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteWorkout(req, res, next) {
    try {
      const { id } = req.params;
      const existingWorkout = await workoutRepository.getWorkoutById(id);

      if (!existingWorkout || existingWorkout.userId !== req.user.id) {
        res.status(404).json({ error: "Workout record not found or access denied." });
        return;
      }

      await workoutRepository.deleteWorkout(id);
      res.json({ success: true, message: "Workout log deleted successfully." });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { workoutController };

const { workoutService } = require("../services/workoutService");

const workoutController = {
  async getWorkouts(req, res, next) {
    try {
      const result = await workoutService.getWorkoutsByUserId(req.user.id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createWorkout(req, res, next) {
    try {
      const newWorkout = await workoutService.createWorkout(req.user.id, req.body);
      res.status(201).json({
        ...newWorkout,
        xp_earned: newWorkout.xp || 0,
        calories_burned: newWorkout.calories || newWorkout.caloriesBurned || 0,
        new_total_xp: newWorkout.reward?.totalXp,
        level: newWorkout.reward?.level,
        title: newWorkout.reward?.title,
        next_level_xp: newWorkout.reward?.nextLevelXp
      });
    } catch (err) {
      next(err);
    }
  },

  async updateWorkout(req, res, next) {
    try {
      const { id } = req.params;
      const { date, title, notes, exercises } = req.body;
      const updated = await workoutService.updateWorkout(req.user.id, id, {
        date,
        title,
        notes,
        exercises
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteWorkout(req, res, next) {
    try {
      const { id } = req.params;
      const result = await workoutService.deleteWorkout(req.user.id, id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async resetWorkoutHistory(req, res, next) {
    try {
      const result = await workoutService.resetWorkoutHistoryByUserId(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { workoutController };


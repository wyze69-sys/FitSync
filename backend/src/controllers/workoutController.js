const { workoutService } = require("../services/workoutService");
const { gamificationService } = require("../services/gamificationService");

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
      if (req.body.category || req.body.categorySlug) {
        const result = await gamificationService.recordAutoWorkout(req.user.id, req.body);
        res.status(201).json(result);
        return;
      }

      const { date, title, notes, exercises } = req.body;
      const newWorkout = await workoutService.createWorkout(req.user.id, {
        date,
        title,
        notes,
        exercises
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
  }
};

module.exports = { workoutController };

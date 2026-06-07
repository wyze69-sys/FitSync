const { gamificationService } = require("../services/gamificationService");

const gamificationController = {
  async getSummary(req, res, next) {
    try {
      const summary = await gamificationService.getSummary(req.user.id);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },

  async createCheckin(req, res, next) {
    try {
      const { type } = req.body;
      const summary = await gamificationService.recordCheckin(req.user.id, type);
      res.status(201).json(summary);
    } catch (err) {
      next(err);
    }
  },

  async getStreakStatus(req, res, next) {
    try {
      const status = await gamificationService.getWeeklyStreakStatus(req.user.id);
      res.json(status);
    } catch (err) {
      next(err);
    }
  },

  async restoreStreak(req, res, next) {
    try {
      const status = await gamificationService.restoreStreak(req.user.id);
      res.json(status);
    } catch (err) {
      next(err);
    }
  },

  async startNewStreak(req, res, next) {
    try {
      const status = await gamificationService.startNewStreak(req.user.id);
      res.json(status);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { gamificationController };

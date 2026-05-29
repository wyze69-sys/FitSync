const { progressService } = require("../services/progressService");

const weightController = {
  async getWeights(req, res, next) {
    try {
      const logs = await progressService.getWeightLogs(req.user.id);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },

  async createWeight(req, res, next) {
    try {
      const { date, weight, notes } = req.body;
      const newLog = await progressService.createWeightLog(req.user.id, {
        date,
        weight,
        notes
      });
      res.status(201).json(newLog);
    } catch (err) {
      next(err);
    }
  },

  async deleteWeight(req, res, next) {
    try {
      const { id } = req.params;
      const result = await progressService.deleteWeightLog(req.user.id, id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { weightController };

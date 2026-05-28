const { userRepository } = require("../repositories/userRepository");
const { weightRepository } = require("../repositories/weightRepository");

const weightController = {
  async getWeights(req, res, next) {
    try {
      const logs = await weightRepository.getWeightLogsByUserId(req.user.id);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },

  async createWeight(req, res, next) {
    try {
      const { date, weight, notes } = req.body;

      if (!date || !weight) {
        res.status(400).json({ error: "Date and Weight parameters are required." });
        return;
      }

      const user = await userRepository.getUserById(req.user.id);
      const height = user?.height || 170;
      const heightMeters = height / 100;
      const bmi = Number((Number(weight) / (heightMeters * heightMeters)).toFixed(1));

      const newLog = await weightRepository.createWeightLog({
        userId: req.user.id,
        date,
        weight: Number(weight),
        bmi,
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
      const logs = await weightRepository.getWeightLogsByUserId(req.user.id);
      const exists = logs.some((log) => log.id === id);

      if (!exists) {
        res.status(404).json({ error: "Weight log entry not found or belongs to another user." });
        return;
      }

      await weightRepository.deleteWeightLog(id);
      res.json({ success: true, message: "Weight log entry deleted." });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { weightController };

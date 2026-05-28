const { aiService } = require("../services/aiService");

const aiController = {
  async getInsights(req, res, next) {
    try {
      const insights = await aiService.getInsightsByUserId(req.user.id);
      res.json(insights);
    } catch (err) {
      next(err);
    }
  },

  async generateWeeklyInsight(req, res, next) {
    try {
      const insight = await aiService.generateWeeklyInsight(req.user.id);
      res.status(201).json(insight);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { aiController };

const { achievementService } = require("../services/achievementService");

const achievementController = {
  async getBadges(req, res, next) {
    try {
      const badges = await achievementService.getBadges();
      res.json(badges);
    } catch (err) {
      next(err);
    }
  },

  async getBadgeDetail(req, res, next) {
    try {
      const { code } = req.params;
      const badge = await achievementService.getBadgeDetail(code);
      res.json(badge);
    } catch (err) {
      next(err);
    }
  },

  async createBadge(req, res, next) {
    try {
      const badge = await achievementService.createBadge(req.body);
      res.status(201).json(badge);
    } catch (err) {
      next(err);
    }
  },

  async updateBadge(req, res, next) {
    try {
      const { code } = req.params;
      const badge = await achievementService.updateBadge(code, req.body);
      res.json(badge);
    } catch (err) {
      next(err);
    }
  },

  async updateBadgeStatus(req, res, next) {
    try {
      const { code } = req.params;
      const { isActive } = req.body;
      const badge = await achievementService.updateBadgeStatus(code, isActive);
      res.json(badge);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { achievementController };

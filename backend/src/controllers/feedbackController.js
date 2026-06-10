const { feedbackService } = require("../services/feedbackService");

const feedbackController = {
  /**
   * POST /api/feedback — user submits feedback (authenticated, any role).
   */
  async submitFeedback(req, res, next) {
    try {
      const userId = req.user?.id ?? null;
      const created = await feedbackService.createFeedback(req.body, userId);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/feedback — list all feedback with optional filters (admin only).
   */
  async getFeedback(req, res, next) {
    try {
      const list = await feedbackService.getFeedbackList(req.query);
      res.json(list);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/feedback/:id — update status and/or admin note (admin only).
   */
  async updateFeedback(req, res, next) {
    try {
      const updated = await feedbackService.updateFeedback(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { feedbackController };

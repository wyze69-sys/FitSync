const { feedbackRepository } = require("../repositories/feedbackRepository");

const VALID_STATUSES = ["new", "in_progress", "resolved", "archived"];

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const feedbackService = {
  /**
   * Admin: list feedback with optional status/type filters.
   * @param {{ status?: string, type?: string }} filters
   */
  async getFeedbackList(filters = {}) {
    return feedbackRepository.getFeedbackList(filters);
  },

  /**
   * Admin: get a single feedback item by id.
   * @param {string} id
   */
  async getFeedbackById(id) {
    const item = await feedbackRepository.getFeedbackById(id);
    if (!item) {
      throw httpError("Feedback record not found.", 404);
    }
    return item;
  },

  /**
   * User: submit new feedback.
   * @param {{ type: string, subject: string, message: string }} data
   * @param {string|null} userId
   */
  async createFeedback(data, userId = null) {
    if (!data.message || !data.message.trim()) {
      throw httpError("Feedback message is required.", 400);
    }
    return feedbackRepository.createFeedback(data, userId);
  },

  /**
   * Admin: update feedback status and/or admin note.
   * @param {string} id
   * @param {{ status?: string, adminNote?: string }} updates
   */
  async updateFeedback(id, updates) {
    const existing = await feedbackRepository.getFeedbackById(id);
    if (!existing) {
      throw httpError("Feedback record not found.", 404);
    }
    if (updates.status !== undefined && !VALID_STATUSES.includes(updates.status)) {
      throw httpError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}.`,
        400
      );
    }
    return feedbackRepository.updateFeedback(id, updates);
  }
};

module.exports = { feedbackService };

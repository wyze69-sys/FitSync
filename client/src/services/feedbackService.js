import apiClient from "./apiClient.js";

/**
 * User-facing feedback operations.
 * Admin feedback triage lives in adminService.js.
 */
const feedbackService = {
  submitFeedback({ type = "general", subject = "", message }) {
    return apiClient.post("/feedback", { type, subject, message });
  }
};

export default feedbackService;

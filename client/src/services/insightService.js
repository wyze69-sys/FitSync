import apiClient from "./apiClient.js";

/**
 * Weekly AI insight service (Gemini-backed, generated server-side).
 */
const insightService = {
  getInsights() {
    return apiClient.get("/ai/insights");
  },

  generateWeeklyInsight() {
    return apiClient.post("/ai/generate-weekly-insight");
  }
};

export default insightService;

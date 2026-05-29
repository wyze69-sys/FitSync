import { apiRequest } from "./api.js";

/**
 * Progress service - handles weight logging and AI insight generation.
 */
const progressService = {
  async getWeightLogs() {
    return apiRequest("/weights");
  },

  async createWeightLog(weightData) {
    return apiRequest("/weights", {
      method: "POST",
      body: weightData,
    });
  },

  async deleteWeightLog(id) {
    return apiRequest(`/weights/${id}`, {
      method: "DELETE",
    });
  },

  async getInsights() {
    return apiRequest("/ai/insights");
  },

  async generateWeeklyInsight() {
    return apiRequest("/ai/generate-weekly-insight", {
      method: "POST",
    });
  },
};

export default progressService;

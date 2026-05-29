import apiClient from "./apiClient.js";

/**
 * Streak and achievement (gamification) service.
 * The summary is computed and persisted server-side.
 */
const gamificationService = {
  getSummary() {
    return apiClient.get("/gamification/summary");
  },

  checkin(type) {
    return apiClient.post("/gamification/checkin", { type });
  }
};

export default gamificationService;

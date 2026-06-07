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
  },

  getStreakStatus() {
    return apiClient.get("/gamification/streak-status");
  },

  restoreStreak() {
    return apiClient.post("/gamification/restore-streak");
  },

  startNewStreak() {
    return apiClient.post("/gamification/start-new-streak");
  }
};

export default gamificationService;

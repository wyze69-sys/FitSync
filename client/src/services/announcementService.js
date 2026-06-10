import apiClient from "./apiClient.js";

/**
 * Service to handle user-facing announcement operations.
 */
const announcementService = {
  /**
   * Fetches all active announcements for the current user.
   * @returns {Promise<Array>} List of active announcements.
   */
  getActiveAnnouncements() {
    return apiClient.get("/announcements/active");
  }
};

export default announcementService;

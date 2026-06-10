import apiClient from "./apiClient.js";

/**
 * Service to handle user-facing workout template operations.
 */
const templateService = {
  /**
   * Fetches all active workout templates.
   * @returns {Promise<Array>} List of active templates.
   */
  getActiveTemplates() {
    return apiClient.get("/templates/active");
  }
};

export default templateService;

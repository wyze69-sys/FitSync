import apiClient from "./apiClient.js";

/**
 * Activity library access. The backend/database is the source of truth for the
 * activity catalog and all calorie/XP metadata; this service only reads it.
 */
const activityService = {
  /**
   * Returns the flat list of active activities, optionally filtered by category.
   * @param {string} [category] Category slug filter.
   */
  getActivities(category) {
    return apiClient.get("/activities", category ? { category } : undefined);
  },

  /**
   * Returns activities grouped by category slug: [{ categorySlug, activities }].
   */
  getGroupedActivities() {
    return apiClient.get("/activities", { grouped: "true" });
  },

  /**
   * Returns a single activity record by slug.
   * @param {string} slug Activity slug.
   */
  getActivity(slug) {
    return apiClient.get(`/activities/${slug}`);
  }
};

export default activityService;

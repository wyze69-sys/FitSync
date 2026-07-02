const { activityRepository } = require("../repositories/activityRepository");

const activityService = {
  /**
   * Returns the flat list of activities, optionally filtered by category slug.
   * @param {object} filters { category }
   * @returns {Promise<object[]>}
   */
  async listActivities(filters = {}) {
    return activityRepository.getActivities(filters);
  },

  /**
   * Returns activities grouped by their category slug, in display order.
   * @param {object} filters { category }
   * @returns {Promise<Array<{categorySlug:string, activities:object[]}>>}
   */
  async listGroupedByCategory(filters = {}) {
    const activities = await activityRepository.getActivities(filters);
    const groups = new Map();
    for (const activity of activities) {
      if (!groups.has(activity.categorySlug)) {
        groups.set(activity.categorySlug, []);
      }
      groups.get(activity.categorySlug).push(activity);
    }
    return Array.from(groups.entries()).map(([categorySlug, items]) => ({
      categorySlug,
      activities: items
    }));
  },

  /**
   * Loads a single activity by slug or id.
   * @param {string} slug Activity slug or id.
   * @returns {Promise<object|null>}
   */
  async getActivity(slug) {
    return activityRepository.getActivityBySlug(slug);
  }
};

module.exports = { activityService };

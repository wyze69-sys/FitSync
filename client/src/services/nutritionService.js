import apiClient from "./apiClient.js";

/**
 * Nutrition dataset access. Backend/database is the source of truth; UI should
 * render these results instead of hardcoding fake food cards.
 */
const nutritionService = {
  getFoods(params = {}) {
    return apiClient.get("/nutrition/foods", params);
  },

  getFood(id) {
    return apiClient.get(`/nutrition/foods/${id}`);
  },

  getRecommendations(params = {}) {
    return apiClient.get("/nutrition/recommendations", params);
  },

  getPlan(params = {}) {
    return apiClient.get("/nutrition/plan", params);
  }
};

export default nutritionService;

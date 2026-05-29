import apiClient from "./apiClient.js";

/**
 * Weight tracking service.
 */
const progressService = {
  getWeightLogs() {
    return apiClient.get("/weights");
  },

  createWeightLog(weightData) {
    return apiClient.post("/weights", weightData);
  },

  deleteWeightLog(id) {
    return apiClient.del(`/weights/${id}`);
  }
};

export default progressService;

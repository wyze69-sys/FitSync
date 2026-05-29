import apiClient from "./apiClient.js";

/**
 * Workout CRUD and category fetching.
 * `getWorkouts` accepts optional filters: { category, search, from, to, sort, page, limit }
 * and returns { items, total, page, limit, totalPages }.
 */
const workoutService = {
  getWorkouts(filters = {}) {
    return apiClient.get("/workouts", filters);
  },

  createWorkout(workoutData) {
    return apiClient.post("/workouts", workoutData);
  },

  updateWorkout(id, workoutData) {
    return apiClient.put(`/workouts/${id}`, workoutData);
  },

  deleteWorkout(id) {
    return apiClient.del(`/workouts/${id}`);
  },

  getCategories() {
    return apiClient.get("/categories");
  }
};

export default workoutService;

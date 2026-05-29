import { apiRequest } from "./api.js";

/**
 * Workout service - handles all workout CRUD and category fetching.
 */
const workoutService = {
  async getWorkouts() {
    return apiRequest("/workouts");
  },

  async createWorkout(workoutData) {
    return apiRequest("/workouts", {
      method: "POST",
      body: workoutData,
    });
  },

  async updateWorkout(id, workoutData) {
    return apiRequest(`/workouts/${id}`, {
      method: "PUT",
      body: workoutData,
    });
  },

  async deleteWorkout(id) {
    return apiRequest(`/workouts/${id}`, {
      method: "DELETE",
    });
  },

  async getCategories() {
    return apiRequest("/categories");
  },
};

export default workoutService;

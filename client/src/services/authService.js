import apiClient from "./apiClient.js";

/**
 * Authentication and profile service.
 */
const authService = {
  login(email, password) {
    return apiClient.post("/auth/login", { email, password });
  },

  register(email, password, name) {
    return apiClient.post("/auth/register", { email, password, name });
  },

  getMe() {
    return apiClient.get("/auth/me");
  },

  updateProfile(profileData) {
    return apiClient.post("/profile/update", profileData);
  },

  resetProfile() {
    return apiClient.post("/profile/reset-profile");
  }
};

export default authService;

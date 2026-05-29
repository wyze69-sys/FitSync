import { apiRequest } from "./api.js";

/**
 * Authentication service - handles login, register, and session verification.
 */
const authService = {
  async login(email, password) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  async register(email, password, name) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: { email, password, name },
    });
  },

  async getMe() {
    return apiRequest("/auth/me");
  },

  async updateProfile(profileData) {
    return apiRequest("/profile/update", {
      method: "POST",
      body: profileData,
    });
  },
};

export default authService;

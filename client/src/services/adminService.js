import { apiRequest } from "./api.js";

/**
 * Admin service - handles admin-only operations (stats, users, categories).
 */
const adminService = {
  async getStats() {
    return apiRequest("/admin/stats");
  },

  async getUsers() {
    return apiRequest("/admin/users");
  },

  async getCategories() {
    return apiRequest("/categories");
  },

  async createCategory(categoryData) {
    return apiRequest("/admin/categories", {
      method: "POST",
      body: categoryData,
    });
  },

  async updateCategory(id, categoryData) {
    return apiRequest(`/admin/categories/${id}`, {
      method: "PUT",
      body: categoryData,
    });
  },

  async deleteCategory(id) {
    return apiRequest(`/admin/categories/${id}`, {
      method: "DELETE",
    });
  },
};

export default adminService;

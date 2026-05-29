import apiClient from "./apiClient.js";

/**
 * Admin-only operations: stats, user management, and category management.
 */
const adminService = {
  getStats() {
    return apiClient.get("/admin/stats");
  },

  getUsers(filters = {}) {
    return apiClient.get("/admin/users", filters);
  },

  getUserDetail(id) {
    return apiClient.get(`/admin/users/${id}`);
  },

  updateUserRole(id, role) {
    return apiClient.put(`/admin/users/${id}/role`, { role });
  },

  updateUserStatus(id, isActive) {
    return apiClient.put(`/admin/users/${id}/status`, { isActive });
  },

  getCategories() {
    return apiClient.get("/categories");
  },

  getCategoryAnalytics() {
    return apiClient.get("/admin/categories/analytics");
  },

  createCategory(categoryData) {
    return apiClient.post("/admin/categories", categoryData);
  },

  updateCategory(id, categoryData) {
    return apiClient.put(`/admin/categories/${id}`, categoryData);
  },

  deleteCategory(id) {
    return apiClient.del(`/admin/categories/${id}`);
  }
};

export default adminService;

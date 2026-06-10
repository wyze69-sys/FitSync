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
  },

  getTemplates() {
    return apiClient.get("/admin/templates");
  },

  getTemplateDetail(id) {
    return apiClient.get(`/admin/templates/${id}`);
  },

  createTemplate(templateData) {
    return apiClient.post("/admin/templates", templateData);
  },

  updateTemplate(id, templateData) {
    return apiClient.put(`/admin/templates/${id}`, templateData);
  },

  updateTemplateStatus(id, isActive) {
    return apiClient.put(`/admin/templates/${id}/status`, { isActive });
  },

  deleteTemplate(id) {
    return apiClient.del(`/admin/templates/${id}`);
  },

  getBadges() {
    return apiClient.get("/admin/badges");
  },

  createBadge(badgeData) {
    return apiClient.post("/admin/badges", badgeData);
  },

  updateBadge(code, badgeData) {
    return apiClient.put(`/admin/badges/${code}`, badgeData);
  },

  updateBadgeStatus(code, isActive) {
    return apiClient.request(`/admin/badges/${code}/status`, {
      method: "PATCH",
      body: { isActive }
    });
  },

  getChallenges() {
    return apiClient.get("/admin/challenges");
  },

  getChallengeDetail(id) {
    return apiClient.get(`/admin/challenges/${id}`);
  },

  createChallenge(challengeData) {
    return apiClient.post("/admin/challenges", challengeData);
  },

  updateChallenge(id, challengeData) {
    return apiClient.put(`/admin/challenges/${id}`, challengeData);
  },

  updateChallengeStatus(id, isActive) {
    return apiClient.request(`/admin/challenges/${id}/status`, {
      method: "PATCH",
      body: { isActive }
    });
  },

  getAnnouncements() {
    return apiClient.get("/admin/announcements");
  },

  getAnnouncementDetail(id) {
    return apiClient.get(`/admin/announcements/${id}`);
  },

  createAnnouncement(announcementData) {
    return apiClient.post("/admin/announcements", announcementData);
  },

  updateAnnouncement(id, announcementData) {
    return apiClient.put(`/admin/announcements/${id}`, announcementData);
  },

  updateAnnouncementStatus(id, isActive) {
    return apiClient.request(`/admin/announcements/${id}/status`, {
      method: "PATCH",
      body: { isActive }
    });
  },

  deleteAnnouncement(id) {
    return apiClient.del(`/admin/announcements/${id}`);
  },

  // Feedback triage
  getFeedbackList(filters = {}) {
    return apiClient.get("/admin/feedback", filters);
  },

  updateFeedback(id, data) {
    return apiClient.request(`/admin/feedback/${id}`, {
      method: "PATCH",
      body: data
    });
  },

  // Analytics
  getAnalytics() {
    return apiClient.get("/admin/analytics");
  }
};

export default adminService;

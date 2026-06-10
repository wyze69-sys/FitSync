const { categoryRepository } = require("../repositories/categoryRepository");
const { userRepository } = require("../repositories/userRepository");
const { gamificationService } = require("./gamificationService");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const adminService = {
  async getUsers(filters = {}) {
    return userRepository.getAdminUserList(filters);
  },

  async getUserDetail(userId) {
    const detail = await userRepository.getUserDetail(userId);
    if (!detail) {
      throw httpError("User not found.", 404);
    }
    return detail;
  },

  async updateUserRole(adminId, userId, role) {
    if (userId === adminId) {
      throw httpError("You cannot change your own role.", 400);
    }
    const updated = await userRepository.updateUserRole(userId, role);
    if (!updated) {
      throw httpError("User not found.", 404);
    }
    const { passwordHash, ...safeUser } = updated;
    return safeUser;
  },

  async updateUserStatus(adminId, userId, isActive) {
    if (userId === adminId) {
      throw httpError("You cannot change your own account status.", 400);
    }
    const updated = await userRepository.updateUserStatus(userId, isActive);
    if (!updated) {
      throw httpError("User not found.", 404);
    }
    const { passwordHash, ...safeUser } = updated;
    return safeUser;
  },

  async createCategory({ name, description }) {
    if (!name || !description) {
      throw httpError("Category name and description are required.", 400);
    }
    return categoryRepository.createCategory({ name, description });
  },

  async updateCategory(categoryId, { name, description }) {
    return categoryRepository.updateCategory(categoryId, { name, description });
  },

  async deleteCategory(categoryId) {
    const deleted = await categoryRepository.deleteCategory(categoryId);
    if (!deleted) {
      throw httpError("Category not found.", 404);
    }
    return { success: true, message: "Category removed." };
  },

  async getCategories() {
    return categoryRepository.getCategories();
  },

  async getCategoryAnalytics() {
    return categoryRepository.getCategoryAnalytics();
  },

  async getStats() {
    const [base, gamification] = await Promise.all([
      categoryRepository.getSystemStats(),
      gamificationService.getStatistics()
    ]);
    return { ...base, gamification };
  },

  async getAnalytics() {
    return categoryRepository.getAnalyticsData();
  }
};

module.exports = { adminService };

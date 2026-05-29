const { categoryRepository } = require("../repositories/categoryRepository");
const { userRepository } = require("../repositories/userRepository");

const adminService = {
  async getUsers() {
    return userRepository.getAdminUserList();
  },

  async createCategory({ name, description }) {
    if (!name || !description) {
      const err = new Error("Category name and description are required.");
      err.status = 400;
      throw err;
    }

    return categoryRepository.createCategory({ name, description });
  },

  async updateCategory(categoryId, { name, description }) {
    return categoryRepository.updateCategory(categoryId, { name, description });
  },

  async deleteCategory(categoryId) {
    const deleted = await categoryRepository.deleteCategory(categoryId);
    if (!deleted) {
      const err = new Error("Category not found.");
      err.status = 404;
      throw err;
    }

    return { success: true, message: "Category removed from metadata registry." };
  },

  async getStats() {
    return categoryRepository.getSystemStats();
  },

  async getCategories() {
    return categoryRepository.getCategories();
  }
};

module.exports = { adminService };

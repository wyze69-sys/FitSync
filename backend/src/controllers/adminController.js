const { categoryRepository } = require("../repositories/categoryRepository");
const { userRepository } = require("../repositories/userRepository");

const adminController = {
  async getUsers(req, res, next) {
    try {
      const users = await userRepository.getAdminUserList();
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name || !description) {
        res.status(400).json({ error: "Category name and description are required." });
        return;
      }

      const category = await categoryRepository.createCategory({ name, description });
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const updated = await categoryRepository.updateCategory(id, { name, description });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await categoryRepository.deleteCategory(id);

      if (!deleted) {
        res.status(404).json({ error: "Category not found." });
        return;
      }

      res.json({ success: true, message: "Category removed from metadata registry." });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await categoryRepository.getSystemStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { adminController };

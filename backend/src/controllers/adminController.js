const { adminService } = require("../services/adminService");

const adminController = {
  async getUsers(req, res, next) {
    try {
      const users = await adminService.getUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;
      const category = await adminService.createCategory({ name, description });
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const updated = await adminService.updateCategory(id, { name, description });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await adminService.deleteCategory(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { adminController };

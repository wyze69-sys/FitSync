const { adminService } = require("../services/adminService");

const categoryController = {
  async getCategories(req, res, next) {
    try {
      const categories = await adminService.getCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { categoryController };

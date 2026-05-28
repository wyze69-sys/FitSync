const { categoryRepository } = require("../repositories/categoryRepository");

const categoryController = {
  async getCategories(req, res, next) {
    try {
      const categories = await categoryRepository.getCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { categoryController };

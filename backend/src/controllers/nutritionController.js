const { nutritionService } = require("../services/nutritionService");

const nutritionController = {
  async getFoods(req, res, next) {
    try {
      const foods = await nutritionService.listFoods(req.query || {});
      res.json(foods);
    } catch (err) {
      next(err);
    }
  },

  async getFood(req, res, next) {
    try {
      const food = await nutritionService.getFood(req.params.id);
      if (!food) return res.status(404).json({ message: "Food not found." });
      return res.json(food);
    } catch (err) {
      return next(err);
    }
  },

  async getRecommendations(req, res, next) {
    try {
      const recommendations = await nutritionService.getRecommendations(req.query || {});
      res.json({ recommendations, source: "nutrition_foods", count: recommendations.length });
    } catch (err) {
      next(err);
    }
  },

  async getPlan(req, res, next) {
    try {
      const plan = await nutritionService.getPlan(req.user.id, req.query || {});
      res.json(plan);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { nutritionController };

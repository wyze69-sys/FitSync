const { authService } = require("../services/authService");

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register({ email, password, name });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { authController };

const { userService } = require("../services/userService");

const profileController = {
  async updateProfile(req, res, next) {
    try {
      const { age, gender, height, weight, goal, activityLevel, name } = req.body;
      const updatedUser = await userService.updateProfile(req.user.id, {
        name, age, gender, height, weight, goal, activityLevel
      });
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { profileController };

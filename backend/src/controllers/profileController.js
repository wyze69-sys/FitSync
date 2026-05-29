const { userService } = require("../services/userService");

const profileController = {
  async updateProfile(req, res, next) {
    try {
      const {
        name,
        age,
        gender,
        height,
        weight,
        targetWeight,
        preferredWorkoutType,
        goal,
        activityLevel
      } = req.body;
      const updatedUser = await userService.updateProfile(req.user.id, {
        name,
        age,
        gender,
        height,
        weight,
        targetWeight,
        preferredWorkoutType,
        goal,
        activityLevel
      });
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { profileController };

const { userRepository } = require("../repositories/userRepository");

const profileController = {
  async updateProfile(req, res, next) {
    try {
      const { age, gender, height, weight, goal, activityLevel, name } = req.body;
      const updates = {};

      if (name !== undefined) updates.name = name;
      if (age !== undefined) updates.age = age !== null && age !== "" ? Number(age) : null;
      if (gender !== undefined) updates.gender = gender;
      if (height !== undefined) updates.height = height !== null && height !== "" ? Number(height) : null;
      if (weight !== undefined) updates.weight = weight !== null && weight !== "" ? Number(weight) : null;
      if (goal !== undefined) updates.goal = goal;
      if (activityLevel !== undefined) updates.activityLevel = activityLevel;

      const updatedUser = await userRepository.updateUser(req.user.id, updates);
      const { passwordHash: ignored, ...userSafe } = updatedUser;
      res.json(userSafe);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { profileController };

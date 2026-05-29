const { userRepository } = require("../repositories/userRepository");

const userService = {
  async updateProfile(userId, updates) {
    const fields = {};

    if (updates.name !== undefined) fields.name = updates.name;
    if (updates.age !== undefined) fields.age = updates.age !== null && updates.age !== "" ? Number(updates.age) : null;
    if (updates.gender !== undefined) fields.gender = updates.gender;
    if (updates.height !== undefined) fields.height = updates.height !== null && updates.height !== "" ? Number(updates.height) : null;
    if (updates.weight !== undefined) fields.weight = updates.weight !== null && updates.weight !== "" ? Number(updates.weight) : null;
    if (updates.goal !== undefined) fields.goal = updates.goal;
    if (updates.activityLevel !== undefined) fields.activityLevel = updates.activityLevel;

    const updatedUser = await userRepository.updateUser(userId, fields);
    const { passwordHash: ignored, ...userSafe } = updatedUser;
    return userSafe;
  }
};

module.exports = { userService };

const { userRepository } = require("../repositories/userRepository");

function normalizeNumeric(value) {
  if (value === null || value === "" || value === undefined) return null;
  return Number(value);
}

const userService = {
  async updateProfile(userId, updates) {
    const fields = {};

    if (updates.name !== undefined) fields.name = updates.name;
    if (updates.age !== undefined) fields.age = normalizeNumeric(updates.age);
    if (updates.gender !== undefined) fields.gender = updates.gender;
    if (updates.height !== undefined) fields.height = normalizeNumeric(updates.height);
    if (updates.weight !== undefined) fields.weight = normalizeNumeric(updates.weight);
    if (updates.targetWeight !== undefined)
      fields.targetWeight = normalizeNumeric(updates.targetWeight);
    if (updates.preferredWorkoutType !== undefined)
      fields.preferredWorkoutType = updates.preferredWorkoutType;
    if (updates.goal !== undefined) fields.goal = updates.goal;
    if (updates.activityLevel !== undefined) fields.activityLevel = updates.activityLevel;

    const updatedUser = await userRepository.updateUser(userId, fields);
    const { passwordHash, ...userSafe } = updatedUser;
    return userSafe;
  }
};

module.exports = { userService };

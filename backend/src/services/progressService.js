const { userRepository } = require("../repositories/userRepository");
const { weightRepository } = require("../repositories/weightRepository");

/**
 * Calculate BMI from weight (kg) and height (cm)
 */
function calculateBMI(weightKg, heightCm) {
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

const progressService = {
  async getWeightLogs(userId) {
    return weightRepository.getWeightLogsByUserId(userId);
  },

  async createWeightLog(userId, { date, weight, notes }) {
    if (!date || !weight) {
      const err = new Error("Date and Weight parameters are required.");
      err.status = 400;
      throw err;
    }

    const user = await userRepository.getUserById(userId);
    const height = user?.height || 170;
    const bmi = calculateBMI(Number(weight), height);

    return weightRepository.createWeightLog({
      userId,
      date,
      weight: Number(weight),
      bmi,
      notes
    });
  },

  async deleteWeightLog(userId, logId) {
    const logs = await weightRepository.getWeightLogsByUserId(userId);
    const exists = logs.some((log) => log.id === logId);

    if (!exists) {
      const err = new Error("Weight log entry not found or belongs to another user.");
      err.status = 404;
      throw err;
    }

    await weightRepository.deleteWeightLog(logId);
    return { success: true, message: "Weight log entry deleted." };
  }
};

module.exports = { progressService, calculateBMI };

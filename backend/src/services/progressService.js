const { calculateBMI } = require("../utils/calculateBMI");
const { userRepository } = require("../repositories/userRepository");
const { weightRepository } = require("../repositories/weightRepository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const progressService = {
  async getWeightLogs(userId) {
    return weightRepository.getWeightLogsByUserId(userId);
  },

  async createWeightLog(userId, { date, weight, notes }) {
    if (!date || !weight) {
      throw httpError("Date and weight are required.", 400);
    }

    const user = await userRepository.getUserById(userId);
    const bmi = calculateBMI(Number(weight), user?.height || 170);

    return weightRepository.createWeightLog({
      userId,
      date,
      weight: Number(weight),
      bmi,
      notes
    });
  },

  async deleteWeightLog(userId, logId) {
    const deleted = await weightRepository.deleteWeightLog(logId, userId);
    if (!deleted) {
      throw httpError("Weight log entry not found.", 404);
    }
    return { success: true, message: "Weight log entry deleted." };
  }
};

module.exports = { progressService };

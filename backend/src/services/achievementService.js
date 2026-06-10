const { achievementRepository } = require("../repositories/achievementRepository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const achievementService = {
  async getBadges() {
    return achievementRepository.getBadges();
  },

  async getBadgeDetail(code) {
    const badge = await achievementRepository.getBadgeByCode(code);
    if (!badge) {
      throw httpError("Badge not found.", 404);
    }
    return badge;
  },

  async createBadge(badgeData) {
    const existing = await achievementRepository.getBadgeByCode(badgeData.code);
    if (existing) {
      throw httpError("Badge code already exists.", 400);
    }
    return achievementRepository.createBadge(badgeData);
  },

  async updateBadge(code, updates) {
    const existing = await achievementRepository.getBadgeByCode(code);
    if (!existing) {
      throw httpError("Badge not found.", 404);
    }
    return achievementRepository.updateBadge(code, updates);
  },

  async updateBadgeStatus(code, isActive) {
    const existing = await achievementRepository.getBadgeByCode(code);
    if (!existing) {
      throw httpError("Badge not found.", 404);
    }
    return achievementRepository.updateBadgeStatus(code, isActive);
  }
};

module.exports = { achievementService };

const { challengeRepository } = require("../repositories/challengeRepository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const challengeService = {
  async getChallenges() {
    return challengeRepository.getChallenges();
  },

  async getChallengeById(id) {
    const challenge = await challengeRepository.getChallengeById(id);
    if (!challenge) {
      throw httpError("Challenge not found.", 404);
    }
    return challenge;
  },

  async getActiveChallenges() {
    return challengeRepository.getActiveChallenges();
  },

  async createChallenge(challengeData, creatorId = null) {
    if (challengeData.badgeCode) {
      const exists = await challengeRepository.achievementExists(challengeData.badgeCode);
      if (!exists) {
        throw httpError(`Badge code '${challengeData.badgeCode}' does not exist.`, 400);
      }
    }
    return challengeRepository.createChallenge(challengeData, creatorId);
  },

  async updateChallenge(id, updates) {
    const existing = await challengeRepository.getChallengeById(id);
    if (!existing) {
      throw httpError("Challenge not found.", 404);
    }

    if (updates.badgeCode) {
      const exists = await challengeRepository.achievementExists(updates.badgeCode);
      if (!exists) {
        throw httpError(`Badge code '${updates.badgeCode}' does not exist.`, 400);
      }
    }

    return challengeRepository.updateChallenge(id, updates);
  },

  async updateChallengeStatus(id, isActive) {
    const existing = await challengeRepository.getChallengeById(id);
    if (!existing) {
      throw httpError("Challenge not found.", 404);
    }
    return challengeRepository.updateChallenge(id, { isActive });
  }
};

module.exports = { challengeService };

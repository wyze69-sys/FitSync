const { challengeService } = require("../services/challengeService");

const challengeController = {
  async getChallenges(req, res, next) {
    try {
      const challenges = await challengeService.getChallenges();
      res.json(challenges);
    } catch (err) {
      next(err);
    }
  },

  async getChallengeDetail(req, res, next) {
    try {
      const challenge = await challengeService.getChallengeById(req.params.id);
      res.json(challenge);
    } catch (err) {
      next(err);
    }
  },

  async createChallenge(req, res, next) {
    try {
      const challenge = await challengeService.createChallenge(req.body, req.user?.id);
      res.status(201).json(challenge);
    } catch (err) {
      next(err);
    }
  },

  async updateChallenge(req, res, next) {
    try {
      const challenge = await challengeService.updateChallenge(req.params.id, req.body);
      res.json(challenge);
    } catch (err) {
      next(err);
    }
  },

  async updateChallengeStatus(req, res, next) {
    try {
      const challenge = await challengeService.updateChallengeStatus(req.params.id, req.body.isActive);
      res.json(challenge);
    } catch (err) {
      next(err);
    }
  },

  async getActiveChallenges(req, res, next) {
    try {
      const challenges = await challengeService.getActiveChallenges();
      res.json(challenges);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { challengeController };

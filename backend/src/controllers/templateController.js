const { templateService } = require("../services/templateService");

const templateController = {
  async getTemplates(req, res, next) {
    try {
      const templates = await templateService.getTemplates();
      res.json(templates);
    } catch (err) {
      next(err);
    }
  },

  async getTemplateDetail(req, res, next) {
    try {
      const template = await templateService.getTemplateById(req.params.id);
      res.json(template);
    } catch (err) {
      next(err);
    }
  },

  async createTemplate(req, res, next) {
    try {
      const template = await templateService.createTemplate(req.body, req.user?.id);
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  },

  async updateTemplate(req, res, next) {
    try {
      const template = await templateService.updateTemplate(req.params.id, req.body);
      res.json(template);
    } catch (err) {
      next(err);
    }
  },

  async updateTemplateStatus(req, res, next) {
    try {
      const template = await templateService.updateTemplateStatus(req.params.id, req.body.isActive);
      res.json(template);
    } catch (err) {
      next(err);
    }
  },

  async deleteTemplate(req, res, next) {
    try {
      const result = await templateService.deleteTemplate(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getActiveTemplates(req, res, next) {
    try {
      const templates = await templateService.getActiveTemplates();
      res.json(templates);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { templateController };

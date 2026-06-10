const { templateRepository } = require("../repositories/templateRepository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const templateService = {
  async getTemplates() {
    return templateRepository.getTemplates();
  },

  async getTemplateById(id) {
    const template = await templateRepository.getTemplateById(id);
    if (!template) {
      throw httpError("Workout template not found.", 404);
    }
    return template;
  },

  async getActiveTemplates() {
    return templateRepository.getActiveTemplates();
  },

  async createTemplate(templateData, creatorId = null) {
    return templateRepository.createTemplate(templateData, creatorId);
  },

  async updateTemplate(id, templateData) {
    const existing = await templateRepository.getTemplateById(id);
    if (!existing) {
      throw httpError("Workout template not found.", 404);
    }
    return templateRepository.updateTemplate(id, templateData);
  },

  async updateTemplateStatus(id, isActive) {
    const existing = await templateRepository.getTemplateById(id);
    if (!existing) {
      throw httpError("Workout template not found.", 404);
    }
    return templateRepository.updateTemplate(id, { isActive });
  },

  async deleteTemplate(id) {
    const deleted = await templateRepository.deleteTemplate(id);
    if (!deleted) {
      throw httpError("Workout template not found.", 404);
    }
    return { success: true, message: "Workout template removed." };
  }
};

module.exports = { templateService };

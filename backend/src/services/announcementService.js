const { announcementRepository } = require("../repositories/announcementRepository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const announcementService = {
  async getAnnouncements() {
    return announcementRepository.getAnnouncements();
  },

  async getAnnouncementById(id) {
    const announcement = await announcementRepository.getAnnouncementById(id);
    if (!announcement) {
      throw httpError("Announcement not found.", 404);
    }
    return announcement;
  },

  async getActiveAnnouncements(userRole) {
    const audienceList = userRole === "admin" ? ["all", "admins"] : ["all", "users"];
    // format current date-time in UTC standard to ensure correct timezone range checking in DB
    const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
    return announcementRepository.getActiveAnnouncements(audienceList, nowStr);
  },

  async createAnnouncement(data, creatorId = null) {
    if (data.startAt && isNaN(Date.parse(data.startAt))) {
      throw httpError("Invalid startAt date format.", 400);
    }
    if (data.endAt && isNaN(Date.parse(data.endAt))) {
      throw httpError("Invalid endAt date format.", 400);
    }
    if (data.startAt && data.endAt) {
      const start = new Date(data.startAt);
      const end = new Date(data.endAt);
      if (start > end) {
        throw httpError("startAt must be before or equal to endAt.", 400);
      }
    }
    return announcementRepository.createAnnouncement(data, creatorId);
  },

  async updateAnnouncement(id, updates) {
    const existing = await announcementRepository.getAnnouncementById(id);
    if (!existing) {
      throw httpError("Announcement not found.", 404);
    }

    const startAt = updates.startAt !== undefined ? updates.startAt : existing.startAt;
    const endAt = updates.endAt !== undefined ? updates.endAt : existing.endAt;

    if (updates.startAt && isNaN(Date.parse(updates.startAt))) {
      throw httpError("Invalid startAt date format.", 400);
    }
    if (updates.endAt && isNaN(Date.parse(updates.endAt))) {
      throw httpError("Invalid endAt date format.", 400);
    }

    if (startAt && endAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);
      if (start > end) {
        throw httpError("startAt must be before or equal to endAt.", 400);
      }
    }

    return announcementRepository.updateAnnouncement(id, updates);
  },

  async updateAnnouncementStatus(id, isActive) {
    const existing = await announcementRepository.getAnnouncementById(id);
    if (!existing) {
      throw httpError("Announcement not found.", 404);
    }
    return announcementRepository.updateAnnouncement(id, { isActive });
  },

  async deleteAnnouncement(id) {
    const existing = await announcementRepository.getAnnouncementById(id);
    if (!existing) {
      throw httpError("Announcement not found.", 404);
    }
    await announcementRepository.deleteAnnouncement(id);
    return { success: true };
  }
};

module.exports = { announcementService };

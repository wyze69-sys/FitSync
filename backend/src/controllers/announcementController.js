const { announcementService } = require("../services/announcementService");

const announcementController = {
  async getAnnouncements(req, res, next) {
    try {
      const announcements = await announcementService.getAnnouncements();
      res.json(announcements);
    } catch (err) {
      next(err);
    }
  },

  async getAnnouncementDetail(req, res, next) {
    try {
      const announcement = await announcementService.getAnnouncementById(req.params.id);
      res.json(announcement);
    } catch (err) {
      next(err);
    }
  },

  async createAnnouncement(req, res, next) {
    try {
      const announcement = await announcementService.createAnnouncement(req.body, req.user?.id);
      res.status(201).json(announcement);
    } catch (err) {
      next(err);
    }
  },

  async updateAnnouncement(req, res, next) {
    try {
      const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
      res.json(announcement);
    } catch (err) {
      next(err);
    }
  },

  async updateAnnouncementStatus(req, res, next) {
    try {
      const announcement = await announcementService.updateAnnouncementStatus(req.params.id, req.body.isActive);
      res.json(announcement);
    } catch (err) {
      next(err);
    }
  },

  async deleteAnnouncement(req, res, next) {
    try {
      await announcementService.deleteAnnouncement(req.params.id);
      res.json({ success: true, message: "Announcement deleted successfully." });
    } catch (err) {
      next(err);
    }
  },

  async getActiveAnnouncements(req, res, next) {
    try {
      const userRole = req.user?.role || "user";
      const announcements = await announcementService.getActiveAnnouncements(userRole);
      res.json(announcements);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { announcementController };

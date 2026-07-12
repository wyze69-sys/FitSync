const { Router } = require("express");
const { adminController } = require("../controllers/adminController");
const { templateController } = require("../controllers/templateController");
const { achievementController } = require("../controllers/achievementController");
const { challengeController } = require("../controllers/challengeController");
const { announcementController } = require("../controllers/announcementController");
const { feedbackController } = require("../controllers/feedbackController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const {
  categorySchema,
  categoryUpdateSchema,
  roleUpdateSchema,
  statusUpdateSchema,
  adminUserQuerySchema,
  templateCreateSchema,
  templateUpdateSchema,
  templateStatusSchema,
  badgeCreateSchema,
  badgeUpdateSchema,
  challengeCreateSchema,
  challengeUpdateSchema,
  challengeStatusSchema,
  announcementCreateSchema,
  announcementUpdateSchema,
  feedbackQuerySchema,
  feedbackUpdateSchema
} = require("../validation/schemas");


const router = Router();

// All admin routes require authentication AND the admin role.
router.use(authenticateToken, requireAdmin);

router.get("/stats", adminController.getStats);

router.get("/users", validate(adminUserQuerySchema, "query"), adminController.getUsers);
router.get("/users/:id", adminController.getUserDetail);
router.put("/users/:id/role", validate(roleUpdateSchema), adminController.updateUserRole);
router.put("/users/:id/status", validate(statusUpdateSchema), adminController.updateUserStatus);

router.get("/categories/analytics", adminController.getCategoryAnalytics);
router.post("/categories", validate(categorySchema), adminController.createCategory);
router.put("/categories/:id", validate(categoryUpdateSchema), adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// Workout Templates management
router.get("/templates", templateController.getTemplates);
router.get("/templates/:id", templateController.getTemplateDetail);
router.post("/templates", validate(templateCreateSchema), templateController.createTemplate);
router.put("/templates/:id", validate(templateUpdateSchema), templateController.updateTemplate);
router.put("/templates/:id/status", validate(templateStatusSchema), templateController.updateTemplateStatus);
router.delete("/templates/:id", templateController.deleteTemplate);

// Achievement Badges management
router.get("/badges", achievementController.getBadges);
router.get("/badges/:code", achievementController.getBadgeDetail);
router.post("/badges", validate(badgeCreateSchema), achievementController.createBadge);
router.put("/badges/:code", validate(badgeUpdateSchema), achievementController.updateBadge);
router.patch("/badges/:code/status", validate(statusUpdateSchema), achievementController.updateBadgeStatus);

// Challenges management
router.get("/challenges", challengeController.getChallenges);
router.get("/challenges/:id", challengeController.getChallengeDetail);
router.post("/challenges", validate(challengeCreateSchema), challengeController.createChallenge);
router.put("/challenges/:id", validate(challengeUpdateSchema), challengeController.updateChallenge);
router.patch("/challenges/:id/status", validate(challengeStatusSchema), challengeController.updateChallengeStatus);

// Announcements management
router.get("/announcements", announcementController.getAnnouncements);
router.get("/announcements/:id", announcementController.getAnnouncementDetail);
router.post("/announcements", validate(announcementCreateSchema), announcementController.createAnnouncement);
router.put("/announcements/:id", validate(announcementUpdateSchema), announcementController.updateAnnouncement);
router.patch("/announcements/:id/status", validate(statusUpdateSchema), announcementController.updateAnnouncementStatus);
router.delete("/announcements/:id", announcementController.deleteAnnouncement);

// User Feedback triage (admin view + status update)
router.get("/feedback", validate(feedbackQuerySchema, "query"), feedbackController.getFeedback);
router.patch("/feedback/:id", validate(feedbackUpdateSchema), feedbackController.updateFeedback);
router.delete("/feedback/:id", feedbackController.deleteFeedback);

// Analytics
router.get("/analytics", adminController.getAnalytics);

module.exports = router;


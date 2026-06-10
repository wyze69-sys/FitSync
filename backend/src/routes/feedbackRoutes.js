// Feedback Routes
// User-facing POST /api/feedback for submitting feedback.
// Admin management routes (list, patch) live in adminRoutes.js under /api/admin/feedback.

const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { feedbackCreateSchema } = require("../validation/schemas");
const { feedbackController } = require("../controllers/feedbackController");

const router = Router();

// Authenticated users submit feedback.
// Optional auth: req.user will be null for unauthenticated callers but we require
// a valid token so the user_id is always captured for tracking purposes.
router.post("/", authenticateToken, validate(feedbackCreateSchema), feedbackController.submitFeedback);

module.exports = router;

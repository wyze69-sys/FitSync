const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { activityQuerySchema } = require("../validation/schemas");
const { activityController } = require("../controllers/activityController");

const router = Router();

router.get(
  "/",
  authenticateToken,
  validate(activityQuerySchema, "query"),
  activityController.getActivities
);
router.get("/:slug", authenticateToken, activityController.getActivity);

module.exports = router;

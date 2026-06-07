const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { checkinSchema } = require("../validation/schemas");
const { gamificationController } = require("../controllers/gamificationController");

const router = Router();

router.get("/summary", authenticateToken, gamificationController.getSummary);
router.post(
  "/checkin",
  authenticateToken,
  validate(checkinSchema),
  gamificationController.createCheckin
);
router.get("/streak-status", authenticateToken, gamificationController.getStreakStatus);
router.post("/restore-streak", authenticateToken, gamificationController.restoreStreak);
router.post("/start-new-streak", authenticateToken, gamificationController.startNewStreak);

module.exports = router;

const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { announcementController } = require("../controllers/announcementController");

const router = Router();

router.get("/active", authenticateToken, announcementController.getActiveAnnouncements);

module.exports = router;

const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { challengeController } = require("../controllers/challengeController");

const router = Router();

router.get("/active", authenticateToken, challengeController.getActiveChallenges);

module.exports = router;

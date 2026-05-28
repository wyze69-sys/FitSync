const { Router } = require("express");
const { authenticateToken } = require("../middleware/auth");
const { aiController } = require("../controllers/aiController");

const router = Router();

router.get("/insights", authenticateToken, aiController.getInsights);
router.post("/generate-weekly-insight", authenticateToken, aiController.generateWeeklyInsight);

module.exports = router;

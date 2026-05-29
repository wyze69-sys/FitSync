const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { weightController } = require("../controllers/weightController");

const router = Router();

router.get("/", authenticateToken, weightController.getWeights);
router.post("/", authenticateToken, weightController.createWeight);
router.delete("/:id", authenticateToken, weightController.deleteWeight);

module.exports = router;

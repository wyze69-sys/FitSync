const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { weightLogSchema } = require("../validation/schemas");
const { weightController } = require("../controllers/weightController");

const router = Router();

router.get("/", authenticateToken, weightController.getWeights);
router.post("/", authenticateToken, validate(weightLogSchema), weightController.createWeight);
router.delete("/:id", authenticateToken, weightController.deleteWeight);

module.exports = router;

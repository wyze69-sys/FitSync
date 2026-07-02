const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { nutritionQuerySchema, nutritionRecommendationQuerySchema, nutritionPlanQuerySchema } = require("../validation/schemas");
const { nutritionController } = require("../controllers/nutritionController");

const router = Router();

// Static /plan is declared before the dynamic /foods/:id so it can never be
// captured by a parameterized route.
router.get("/plan", authenticateToken, validate(nutritionPlanQuerySchema, "query"), nutritionController.getPlan);

router.get("/foods", authenticateToken, validate(nutritionQuerySchema, "query"), nutritionController.getFoods);
router.get("/foods/:id", authenticateToken, nutritionController.getFood);
router.get(
  "/recommendations",
  authenticateToken,
  validate(nutritionRecommendationQuerySchema, "query"),
  nutritionController.getRecommendations
);

module.exports = router;

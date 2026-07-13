const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { workoutBodySchema, workoutQuerySchema } = require("../validation/schemas");
const { workoutController } = require("../controllers/workoutController");

const router = Router();

router.get(
  "/",
  authenticateToken,
  validate(workoutQuerySchema, "query"),
  workoutController.getWorkouts
);
router.post("/", authenticateToken, validate(workoutBodySchema), workoutController.createWorkout);
router.put("/:id", authenticateToken, validate(workoutBodySchema), workoutController.updateWorkout);
router.delete("/history", authenticateToken, workoutController.resetWorkoutHistory);
router.delete("/:id", authenticateToken, workoutController.deleteWorkout);


module.exports = router;

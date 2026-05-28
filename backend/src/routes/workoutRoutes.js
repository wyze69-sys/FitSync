const { Router } = require("express");
const { authenticateToken } = require("../middleware/auth");
const { workoutController } = require("../controllers/workoutController");

const router = Router();

router.get("/", authenticateToken, workoutController.getWorkouts);
router.post("/", authenticateToken, workoutController.createWorkout);
router.put("/:id", authenticateToken, workoutController.updateWorkout);
router.delete("/:id", authenticateToken, workoutController.deleteWorkout);

module.exports = router;

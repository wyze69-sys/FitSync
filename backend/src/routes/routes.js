const { Router } = require("express");
const adminRoutes = require("./adminRoutes");
const aiRoutes = require("./aiRoutes");
const authRoutes = require("./authRoutes");
const categoryRoutes = require("./categoryRoutes");
const gamificationRoutes = require("./gamificationRoutes");
const profileRoutes = require("./profileRoutes");
const weightRoutes = require("./weightRoutes");
const workoutRoutes = require("./workoutRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/workouts", workoutRoutes);
router.use("/weights", weightRoutes);
router.use("/categories", categoryRoutes);
router.use("/gamification", gamificationRoutes);
router.use("/ai", aiRoutes);
router.use("/admin", adminRoutes);

module.exports = router;

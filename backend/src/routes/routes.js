const { Router } = require("express");
const adminRoutes = require("./adminRoutes");
const authRoutes = require("./authRoutes");
const categoryRoutes = require("./categoryRoutes");
const gamificationRoutes = require("./gamificationRoutes");
const profileRoutes = require("./profileRoutes");
const weightRoutes = require("./weightRoutes");
const workoutRoutes = require("./workoutRoutes");
const templateRoutes = require("./templateRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const challengeRoutes = require("./challengeRoutes");
const announcementRoutes = require("./announcementRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/workouts", workoutRoutes);
router.use("/weights", weightRoutes);
router.use("/categories", categoryRoutes);
router.use("/gamification", gamificationRoutes);
router.use("/templates", templateRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/challenges", challengeRoutes);
router.use("/announcements", announcementRoutes);
router.use("/admin", adminRoutes);

module.exports = router;

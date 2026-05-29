const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { profileController } = require("../controllers/profileController");

const router = Router();

router.post("/update", authenticateToken, profileController.updateProfile);

module.exports = router;

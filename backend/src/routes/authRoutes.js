const { Router } = require("express");
const { authController } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticateToken, authController.me);

module.exports = router;

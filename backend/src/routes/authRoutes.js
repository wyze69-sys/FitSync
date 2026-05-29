const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const { authController } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = Router();

// Rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  message: { error: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/me", authenticateToken, authController.me);

module.exports = router;

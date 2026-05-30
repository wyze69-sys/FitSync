const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const { authController } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validation/schemas");

const router = Router();

// Rate limiting for auth endpoints to prevent brute-force attacks.
// 50/15min still blocks brute-force on a course project while comfortably
// surviving repeated user/admin logins during a live demo.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth requests per window
  message: { error: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.get("/me", authenticateToken, authController.me);

module.exports = router;

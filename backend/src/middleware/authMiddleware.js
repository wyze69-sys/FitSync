const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/jwt");
const { userRepository } = require("../repositories/userRepository");

/**
 * Middleware to authenticate JWT tokens from Authorization header.
 * Attaches decoded user payload to req.user on success.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Missing authentication token." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret);
    const user = await userRepository.getUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: "Invalid or expired authentication token." });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({ error: "This account has been deactivated. Please contact an administrator." });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

module.exports = { authenticateToken };

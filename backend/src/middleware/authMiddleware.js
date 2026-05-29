const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/jwt");

/**
 * Middleware to authenticate JWT tokens from Authorization header.
 * Attaches decoded user payload to req.user on success.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Missing authentication token." });
    return;
  }

  try {
    req.user = jwt.verify(token, JWT_CONFIG.secret);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

module.exports = { authenticateToken };

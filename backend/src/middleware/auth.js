const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/jwt");

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

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin privileges required." });
    return;
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };

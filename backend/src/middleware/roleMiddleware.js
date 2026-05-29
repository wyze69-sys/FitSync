/**
 * Middleware to restrict access to admin-role users only.
 * Must be used after authenticateToken middleware.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin privileges required." });
    return;
  }
  next();
}

module.exports = { requireAdmin };

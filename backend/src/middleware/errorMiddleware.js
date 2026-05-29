/**
 * Global error handling middleware.
 * Catches all errors passed via next(err) from controllers/services.
 * Returns appropriate HTTP status codes and safe error messages.
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message || err);

  const statusCode = err.status || 500;

  // Only expose error messages for client errors (4xx).
  // For server errors (5xx), return a generic message to avoid leaking internals.
  const message = statusCode < 500 ? err.message || "Request failed." : "Internal server error.";

  res.status(statusCode).json({ error: message });
}

/**
 * 404 handler for undefined routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found." });
}

module.exports = { errorHandler, notFoundHandler };

const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/jwt");

/**
 * Generate a signed JWT token for the given user.
 * @param {Object} user - User object with id, email, and role.
 * @returns {string} Signed JWT token string.
 */
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn
  });
}

module.exports = { generateToken };

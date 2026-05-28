const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: "7d"
};

if (!JWT_CONFIG.secret) {
  throw new Error("JWT_SECRET environment variable is required. Do not use a fallback secret.");
}

module.exports = { JWT_CONFIG };

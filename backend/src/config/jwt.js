const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "change_this_secret",
  expiresIn: "7d"
};

module.exports = { JWT_CONFIG };

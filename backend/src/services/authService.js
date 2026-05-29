const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/jwt");
const { userRepository } = require("../repositories/userRepository");

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );
}

const authService = {
  async register({ email, password, name }) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error("Please provide a valid email address.");
      err.status = 400;
      throw err;
    }

    // Enforce minimum password length
    if (password.length < 8) {
      const err = new Error("Password must be at least 8 characters long.");
      err.status = 400;
      throw err;
    }

    // Enforce name length limits
    if (name.length > 255) {
      const err = new Error("Name must not exceed 255 characters.");
      err.status = 400;
      throw err;
    }

    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      const err = new Error("Account with this email already exists.");
      err.status = 400;
      throw err;
    }

    const passwordHash = bcryptjs.hashSync(password, 10);
    // Security: Always assign 'user' role on self-registration.
    const assignedRole = "user";

    const newUser = await userRepository.createUser({
      email,
      name,
      passwordHash,
      role: assignedRole,
      goal: "Maintain fitness",
      activityLevel: "Sedentary"
    });

    const token = signToken(newUser);
    const { passwordHash: ignored, ...userSafe } = newUser;
    return { user: userSafe, token };
  },

  async login({ email, password }) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error("Please provide a valid email address.");
      err.status = 400;
      throw err;
    }

    const user = await userRepository.getUserByEmail(email);
    if (!user || !bcryptjs.compareSync(password, user.passwordHash)) {
      const err = new Error("Invalid email or password.");
      err.status = 401;
      throw err;
    }

    const token = signToken(user);
    const { passwordHash: ignored, ...userSafe } = user;
    return { user: userSafe, token };
  },

  async getCurrentUser(userId) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      const err = new Error("User not found.");
      err.status = 404;
      throw err;
    }

    const { passwordHash: ignored, ...userSafe } = user;
    return userSafe;
  }
};

module.exports = { authService };

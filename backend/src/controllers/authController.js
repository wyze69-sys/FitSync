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

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: "Name, email, and password parameters are required." });
        return;
      }

      const existingUser = await userRepository.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "Account with this email already exists." });
        return;
      }

      const passwordHash = bcryptjs.hashSync(password, 10);
      const assignedRole = role === "admin" ? "admin" : "user";

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
      res.status(201).json({ user: userSafe, token });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const user = await userRepository.getUserByEmail(email);
      if (!user || !bcryptjs.compareSync(password, user.passwordHash)) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = signToken(user);
      const { passwordHash: ignored, ...userSafe } = user;
      res.json({ user: userSafe, token });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await userRepository.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      const { passwordHash: ignored, ...userSafe } = user;
      res.json(userSafe);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { authController };

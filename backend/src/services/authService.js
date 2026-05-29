const bcryptjs = require("bcryptjs");
const { generateToken } = require("../utils/generateToken");
const { userRepository } = require("../repositories/userRepository");

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function toSafeUser(user) {
  const { passwordHash, ...userSafe } = user;
  return userSafe;
}

const authService = {
  async register({ email, password, name }) {
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      throw httpError("An account with this email already exists.", 400);
    }

    const passwordHash = bcryptjs.hashSync(password, 10);

    // Security: self-registration always creates a standard "user" account.
    const newUser = await userRepository.createUser({
      email,
      name,
      passwordHash,
      role: "user",
      goal: "Maintain fitness",
      activityLevel: "Sedentary"
    });

    const token = generateToken(newUser);
    return { user: toSafeUser(newUser), token };
  },

  async login({ email, password }) {
    const user = await userRepository.getUserByEmail(email);
    if (!user || !bcryptjs.compareSync(password, user.passwordHash)) {
      throw httpError("Invalid email or password.", 401);
    }

    if (user.isActive === false) {
      throw httpError("This account has been deactivated. Please contact an administrator.", 403);
    }

    const token = generateToken(user);
    return { user: toSafeUser(user), token };
  },

  async getCurrentUser(userId) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw httpError("User not found.", 404);
    }
    return toSafeUser(user);
  }
};

module.exports = { authService };

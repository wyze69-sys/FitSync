const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { mapUserRow } = require("../utils/rowMappers");

async function getUsers() {
  const [rows] = await pool.execute("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(mapUserRow);
}

async function getUserById(id) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] ? mapUserRow(rows[0]) : undefined;
}

async function getUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const [rows] = await pool.execute("SELECT * FROM users WHERE LOWER(email) = ?", [normalizedEmail]);
  return rows[0] ? mapUserRow(rows[0]) : undefined;
}

async function createUser(user) {
  const id = user.id || createId("usr");
  const email = user.email.toLowerCase().trim();
  const role = user.role || "user";
  const goal = user.goal || "Maintain fitness";
  const activityLevel = user.activityLevel || "Sedentary";

  await pool.execute(
    `INSERT INTO users (
       id, email, name, role, password_hash, age, gender, height, weight, goal, activity_level
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      email,
      user.name,
      role,
      user.passwordHash,
      user.age || null,
      user.gender || null,
      user.height || null,
      user.weight || null,
      goal,
      activityLevel
    ]
  );

  return getUserById(id);
}

async function syncProfileWeightLog(id, updatedUser, weight) {
  if (weight === undefined || weight === null || weight === "") return;

  const height = updatedUser.height || 170;
  const heightMeters = height / 100;
  const bmi = Number((Number(weight) / (heightMeters * heightMeters)).toFixed(1));
  const today = new Date().toISOString().slice(0, 10);

  const [existingLogs] = await pool.execute(
    "SELECT id FROM weight_logs WHERE user_id = ? AND date = ? LIMIT 1",
    [id, today]
  );

  if (existingLogs.length > 0) {
    await pool.execute(
      "UPDATE weight_logs SET weight = ?, bmi = ? WHERE id = ?",
      [weight, bmi, existingLogs[0].id]
    );
    return;
  }

  await pool.execute(
    `INSERT INTO weight_logs (id, user_id, date, weight, bmi, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [createId("w"), id, today, weight, bmi, "Auto-logged from profile setting"]
  );
}

async function updateUser(id, updates) {
  const existing = await getUserById(id);
  if (!existing) {
    throw new Error("User not found");
  }

  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.age !== undefined) {
    fields.push("age = ?");
    values.push(updates.age);
  }
  if (updates.gender !== undefined) {
    fields.push("gender = ?");
    values.push(updates.gender);
  }
  if (updates.height !== undefined) {
    fields.push("height = ?");
    values.push(updates.height);
  }
  if (updates.weight !== undefined) {
    fields.push("weight = ?");
    values.push(updates.weight);
  }
  if (updates.goal !== undefined) {
    fields.push("goal = ?");
    values.push(updates.goal);
  }
  if (updates.activityLevel !== undefined) {
    fields.push("activity_level = ?");
    values.push(updates.activityLevel);
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const updatedUser = await getUserById(id);
  await syncProfileWeightLog(id, updatedUser, updates.weight);
  return updatedUser;
}

async function getAdminUserList() {
  const users = await getUsers();
  return users.map(({ passwordHash, ...safeUser }) => safeUser);
}

module.exports = {
  userRepository: {
    getUsers,
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    getAdminUserList
  }
};

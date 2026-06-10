const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { calculateBMI } = require("../utils/calculateBMI");
const { mapUserRow } = require("../utils/rowMappers");

const USER_COLUMNS = `id, email, name, role, password_hash, age, gender, height, weight,
  target_weight, preferred_workout_type, goal, activity_level, is_active, created_at, updated_at`;

async function getUserById(id) {
  const [rows] = await pool.execute(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] ? attachUserDashboardStats(mapUserRow(rows[0])) : undefined;
}

function weekBounds(date = new Date()) {
  const today = new Date(date);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    monday: monday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10),
    today: today.toISOString().slice(0, 10)
  };
}

async function attachUserDashboardStats(user) {
  if (!user) return user;

  const { monday, sunday, today } = weekBounds();
  const [[game]] = await pool.execute(
    `SELECT total_xp, level, current_streak, longest_streak
     FROM user_gamification
     WHERE user_id = ?`,
    [user.id]
  );
  const [[stats]] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN date = ? THEN COALESCE(calories_burned, calories_total, 0) ELSE 0 END), 0) AS today_calories,
       COUNT(CASE WHEN date BETWEEN ? AND ? THEN 1 END) AS week_workouts
     FROM workouts
     WHERE user_id = ?`,
    [today, monday, sunday, user.id]
  );
  const level = Number(game?.level || 1);

  return {
    ...user,
    gamification: {
      total_xp: Number(game?.total_xp || 0),
      level,
      current_streak: Number(game?.current_streak || 0),
      longest_streak: Number(game?.longest_streak || 0),
      next_level_xp: level * 150
    },
    todayCalories: Number(stats?.today_calories || 0),
    weekWorkouts: Number(stats?.week_workouts || 0)
  };
}

async function getUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const [rows] = await pool.execute(`SELECT ${USER_COLUMNS} FROM users WHERE LOWER(email) = ?`, [
    normalizedEmail
  ]);
  return rows[0] ? mapUserRow(rows[0]) : undefined;
}

async function createUser(user) {
  const id = user.id || createId("usr");
  const email = user.email.toLowerCase().trim();
  const role = user.role || "user";
  const goal = user.goal || "Maintain fitness";
  const activityLevel = user.activityLevel || "Sedentary";

  // Create the user and initialize their streak row atomically, so a new
  // account always has a user_streaks row (instead of relying solely on lazy
  // creation). If either insert fails, the whole registration rolls back.
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO users (
         id, email, name, role, password_hash, age, gender, height, weight,
         target_weight, preferred_workout_type, goal, activity_level
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        user.targetWeight || null,
        user.preferredWorkoutType || null,
        goal,
        activityLevel
      ]
    );

    await connection.execute(
      `INSERT IGNORE INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
       VALUES (?, 0, 0, NULL)`,
      [id]
    );

    await connection.execute(
      `INSERT IGNORE INTO user_gamification (user_id, total_xp, level, next_level_xp)
       VALUES (?, 0, 1, 150)`,
      [id]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return getUserById(id);
}

async function syncProfileWeightLog(id, updatedUser, weight) {
  if (weight === undefined || weight === null || weight === "") return;

  const bmi = calculateBMI(Number(weight), updatedUser.height || 170);
  const today = new Date().toISOString().slice(0, 10);

  const [existingLogs] = await pool.execute(
    "SELECT id FROM weight_logs WHERE user_id = ? AND date = ? LIMIT 1",
    [id, today]
  );

  if (existingLogs.length > 0) {
    await pool.execute("UPDATE weight_logs SET weight = ?, bmi = ? WHERE id = ?", [
      weight,
      bmi,
      existingLogs[0].id
    ]);
    return;
  }

  await pool.execute(
    `INSERT INTO weight_logs (id, user_id, date, weight, bmi, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [createId("w"), id, today, weight, bmi, "Auto-logged from profile setting"]
  );
}

const PROFILE_FIELD_MAP = {
  name: "name",
  age: "age",
  gender: "gender",
  height: "height",
  weight: "weight",
  targetWeight: "target_weight",
  preferredWorkoutType: "preferred_workout_type",
  goal: "goal",
  activityLevel: "activity_level"
};

async function updateUser(id, updates) {
  const existing = await getUserById(id);
  if (!existing) {
    throw new Error("User not found");
  }

  const fields = [];
  const values = [];

  for (const [key, column] of Object.entries(PROFILE_FIELD_MAP)) {
    if (updates[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  const updatedUser = await getUserById(id);
  await syncProfileWeightLog(id, updatedUser, updates.weight);
  return updatedUser;
}

async function updateUserRole(id, role) {
  const [result] = await pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  if (result.affectedRows === 0) return undefined;
  return getUserById(id);
}

async function updateUserStatus(id, isActive) {
  const [result] = await pool.execute("UPDATE users SET is_active = ? WHERE id = ?", [
    isActive ? 1 : 0,
    id
  ]);
  if (result.affectedRows === 0) return undefined;
  return getUserById(id);
}

function toSafeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Admin listing with optional search (name/email), role, and status filters.
 * Includes per-user activity counts for the admin overview.
 */
async function getAdminUserList({ search, role, status } = {}) {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(u.name LIKE ? OR u.email LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    conditions.push("u.role = ?");
    params.push(role);
  }
  if (status === "active") {
    conditions.push("u.is_active = 1");
  } else if (status === "inactive") {
    conditions.push("u.is_active = 0");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.name, u.role, u.age, u.gender, u.height, u.weight,
            u.target_weight, u.preferred_workout_type, u.goal, u.activity_level,
            u.is_active, u.created_at, u.updated_at,
            (SELECT COUNT(*) FROM workouts w WHERE w.user_id = u.id) AS workout_count,
            (SELECT COUNT(*) FROM weight_logs wl WHERE wl.user_id = u.id) AS weight_count,
            ug.level, ug.total_xp, 
            COALESCE(ug.current_streak, us.current_streak) AS current_streak, 
            COALESCE(ug.longest_streak, us.longest_streak) AS longest_streak,
            us.last_active_date
     FROM users u
     LEFT JOIN user_gamification ug ON ug.user_id = u.id
     LEFT JOIN user_streaks us ON us.user_id = u.id
     ${whereClause}
     ORDER BY u.created_at DESC`,
    params
  );

  return rows.map((row) => ({
    ...toSafeUser(mapUserRow(row)),
    workoutCount: Number(row.workout_count),
    weightCount: Number(row.weight_count),
    level: Number(row.level || 1),
    xp: Number(row.total_xp || 0),
    currentStreak: Number(row.current_streak || 0),
    lastActiveDate: row.last_active_date ? new Date(row.last_active_date).toISOString().slice(0, 10) : null
  }));
}

async function getUserDetail(id) {
  const user = await getUserById(id);
  if (!user) return undefined;

  const [[workoutAgg]] = await pool.query(
    `SELECT COUNT(*) AS workout_count,
            COALESCE(SUM(calories_total), 0) AS total_calories,
            COALESCE(SUM(duration_total), 0) AS total_minutes,
            MAX(date) AS last_workout_date
     FROM workouts WHERE user_id = ?`,
    [id]
  );
  const [[weightAgg]] = await pool.query(
    "SELECT COUNT(*) AS weight_count, MAX(date) AS last_weight_date FROM weight_logs WHERE user_id = ?",
    [id]
  );
  const [[insightAgg]] = await pool.query(
    "SELECT COUNT(*) AS insight_count FROM ai_insights WHERE user_id = ?",
    [id]
  );
  const [recentWorkouts] = await pool.execute(
    "SELECT id, date, title, duration_total, calories_total FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 5",
    [id]
  );

  return {
    user: toSafeUser(user),
    stats: {
      workoutCount: Number(workoutAgg.workout_count),
      totalCalories: Number(workoutAgg.total_calories),
      totalMinutes: Number(workoutAgg.total_minutes),
      lastWorkoutDate: workoutAgg.last_workout_date
        ? String(workoutAgg.last_workout_date).slice(0, 10)
        : null,
      weightCount: Number(weightAgg.weight_count),
      lastWeightDate: weightAgg.last_weight_date
        ? String(weightAgg.last_weight_date).slice(0, 10)
        : null,
      insightCount: Number(insightAgg.insight_count)
    },
    recentWorkouts: recentWorkouts.map((row) => ({
      id: row.id,
      date: String(row.date).slice(0, 10),
      title: row.title,
      durationTotal: Number(row.duration_total),
      caloriesTotal: Number(row.calories_total)
    }))
  };
}

module.exports = {
  userRepository: {
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    getAdminUserList,
    getUserDetail
  }
};

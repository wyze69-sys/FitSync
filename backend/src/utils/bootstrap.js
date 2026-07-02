const bcryptjs = require("bcryptjs");
const mysql = require("mysql2/promise");
const pool = require("../config/db");
const { cumulativeXpForLevel } = require("./calculators");

function toMysqlDate(date) {
  return date.toISOString().slice(0, 10);
}

function toMysqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function ensureDatabaseExists() {
  const database = process.env.DB_NAME || "fitsync_db";
  const safeDatabase = database.replace(/`/g, "");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 8889),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${safeDatabase}\``);
  await connection.end();
}

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      password_hash VARCHAR(255) NOT NULL,
      age INT,
      gender VARCHAR(50),
      height DECIMAL(5,2),
      weight DECIMAL(5,2),
      weight_kg DECIMAL(5,2),
      total_xp INT NOT NULL DEFAULT 0,
      target_weight DECIMAL(5,2),
      preferred_workout_type VARCHAR(50),
      goal VARCHAR(255) DEFAULT 'Maintain fitness',
      activity_level VARCHAR(255) DEFAULT 'Sedentary',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exercise_categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT NOT NULL,
      slug VARCHAR(80) UNIQUE,
      base_met DECIMAL(4,2) NOT NULL DEFAULT 3.50,
      xp_per_met_min DECIMAL(5,3) NOT NULL DEFAULT 0.200,
      is_custom BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_library (
      id VARCHAR(50) PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category_slug VARCHAR(80) NOT NULL,
      category_id VARCHAR(50) NULL,
      description TEXT,
      base_met DECIMAL(4,2) NOT NULL DEFAULT 3.50,
      intensity_level ENUM('low','moderate','high','very_high') NOT NULL DEFAULT 'moderate',
      calorie_method VARCHAR(40) NOT NULL DEFAULT 'met_duration',
      pace_profile VARCHAR(40) NULL,
      supports_distance BOOLEAN NOT NULL DEFAULT FALSE,
      supports_duration BOOLEAN NOT NULL DEFAULT TRUE,
      supports_sets_reps_weight BOOLEAN NOT NULL DEFAULT FALSE,
      supports_bodyweight BOOLEAN NOT NULL DEFAULT FALSE,
      supports_reps_only BOOLEAN NOT NULL DEFAULT FALSE,
      supports_hold_time BOOLEAN NOT NULL DEFAULT FALSE,
      distance_multiplier DECIMAL(6,3) NULL,
      bodyweight_factor DECIMAL(4,2) NULL,
      volume_modifier_min DECIMAL(4,2) NULL,
      volume_modifier_max DECIMAL(4,2) NULL,
      default_duration_min INT NULL,
      equipment VARCHAR(255) NULL,
      primary_muscles VARCHAR(255) NULL,
      secondary_muscles VARCHAR(255) NULL,
      tracking_fields JSON NULL,
      calculation_notes TEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_activity_category FOREIGN KEY (category_id) REFERENCES exercise_categories(id) ON DELETE SET NULL,
      INDEX idx_activity_category (category_slug),
      INDEX idx_activity_active (is_active)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS nutrition_foods (
      id VARCHAR(160) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      serving_size VARCHAR(120) NOT NULL DEFAULT 'dataset serving',
      calories INT NOT NULL DEFAULT 0,
      protein_g DECIMAL(8,3) NOT NULL DEFAULT 0,
      carbs_g DECIMAL(8,3) NOT NULL DEFAULT 0,
      fat_g DECIMAL(8,3) NOT NULL DEFAULT 0,
      fiber_g DECIMAL(8,3) NOT NULL DEFAULT 0,
      sugar_g DECIMAL(8,3) NOT NULL DEFAULT 0,
      sodium_mg DECIMAL(10,3) NOT NULL DEFAULT 0,
      food_type VARCHAR(40) NOT NULL DEFAULT 'general',
      diet_tags JSON NULL,
      source_dataset VARCHAR(255) NULL,
      source_file VARCHAR(120) NULL,
      source_group VARCHAR(40) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_nutrition_name (name),
      INDEX idx_nutrition_food_type (food_type),
      INDEX idx_nutrition_active (is_active)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workouts (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      title VARCHAR(255) NOT NULL,
      duration_total INT NOT NULL DEFAULT 0,
      calories_total INT NOT NULL DEFAULT 0,
      calories_burned INT,
      calories INT,
      xp INT NOT NULL DEFAULT 0,
      intensity ENUM('low','med','high') NOT NULL DEFAULT 'med',
      calories_source ENUM('auto','manual') NOT NULL DEFAULT 'auto',
      user_weight_at_log DECIMAL(5,2),
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_workouts_user_date (user_id, date)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id VARCHAR(50) PRIMARY KEY,
      workout_id VARCHAR(50) NOT NULL,
      category_id VARCHAR(50),
      category_name VARCHAR(255),
      activity_id VARCHAR(50) NULL,
      activity_slug VARCHAR(100) NULL,
      exercise_name VARCHAR(255) NOT NULL,
      duration INT NOT NULL DEFAULT 0,
      calories_burned INT NOT NULL DEFAULT 0,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES exercise_categories(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exercise_id VARCHAR(50) NOT NULL,
      reps INT NOT NULL DEFAULT 0,
      weight DECIMAL(6,2) NOT NULL DEFAULT 0.00,
      FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weight_logs (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      weight DECIMAL(5,2) NOT NULL,
      bmi DECIMAL(4,1) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_weight_user_date (user_id, date)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      date_generated DATE NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      workout_count INT NOT NULL DEFAULT 0,
      total_calories INT NOT NULL DEFAULT 0,
      total_minutes INT NOT NULL DEFAULT 0,
      bmi_value DECIMAL(4,1) NOT NULL,
      current_weight DECIMAL(5,2) NOT NULL,
      summary TEXT NOT NULL,
      recommendations JSON NOT NULL,
      goal_progress TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_insights_user_created (user_id, created_at)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_checkins (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'Wellness check-in',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_checkin_user_date (user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      code VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(500) NOT NULL,
      requirement_type VARCHAR(30) NOT NULL DEFAULT 'streak',
      requirement_value INT NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      icon VARCHAR(80) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      achievement_code VARCHAR(50) NOT NULL,
      unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_achievement (user_id, achievement_code),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_code) REFERENCES achievements(code) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id VARCHAR(50) PRIMARY KEY,
      current_streak INT NOT NULL DEFAULT 0,
      longest_streak INT NOT NULL DEFAULT 0,
      last_active_date DATE,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_gamification (
      user_id VARCHAR(50) PRIMARY KEY,
      total_xp INT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      next_level_xp INT NOT NULL DEFAULT 150,
      current_streak INT NOT NULL DEFAULT 0,
      longest_streak INT NOT NULL DEFAULT 0,
      last_active_date DATE,
      last_workout_date DATE,
      weekly_freezes_used INT NOT NULL DEFAULT 0,
      streak_freeze_used BOOLEAN NOT NULL DEFAULT FALSE,
      last_freeze_week VARCHAR(16),
      weekly_streak INT NOT NULL DEFAULT 0,
      weekly_longest_streak INT NOT NULL DEFAULT 0,
      streak_freezes TINYINT NOT NULL DEFAULT 2,
      paid_restores_this_month TINYINT NOT NULL DEFAULT 0,
      last_freeze_reset DATE NULL,
      last_counted_week_start DATE NULL,
      at_risk_week_start DATE NULL,
      restore_deadline DATETIME NULL,
      streak_status ENUM('active', 'at_risk', 'broken') NOT NULL DEFAULT 'active',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS levels (
      id VARCHAR(50) PRIMARY KEY,
      level_number INT NOT NULL UNIQUE,
      xp_required INT NOT NULL,
      badge_unlock VARCHAR(50),
      title VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS xp_logs (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      workout_id VARCHAR(50),
      xp_earned INT NOT NULL,
      reason VARCHAR(255) NOT NULL,
      breakdown JSON,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL,
      INDEX idx_xp_logs_user_created (user_id, created_at)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category_id VARCHAR(50) NULL,
      category_name VARCHAR(255) NOT NULL,
      subtype VARCHAR(255) NULL,
      duration_min INT NOT NULL DEFAULT 30,
      exercises JSON NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INT NOT NULL DEFAULT 0,
      created_by VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_templates_category FOREIGN KEY (category_id) REFERENCES exercise_categories(id) ON DELETE SET NULL,
      CONSTRAINT fk_templates_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS challenges (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      challenge_type VARCHAR(50) NOT NULL,
      target_value INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reward_xp INT NOT NULL DEFAULT 0,
      badge_code VARCHAR(50) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_challenges_badge FOREIGN KEY (badge_code) REFERENCES achievements(code) ON DELETE SET NULL,
      CONSTRAINT fk_challenges_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      audience ENUM('all','users','admins') NOT NULL DEFAULT 'users',
      placement VARCHAR(50) NOT NULL DEFAULT 'dashboard',
      start_at DATETIME NULL,
      end_at DATETIME NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_announcements_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_feedback (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NULL,
      type ENUM('bug', 'feature', 'general') NOT NULL DEFAULT 'general',
      subject VARCHAR(255) NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      status ENUM('new', 'in_progress', 'resolved', 'archived') NOT NULL DEFAULT 'new',
      admin_note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_feedback_status (status),
      INDEX idx_feedback_type (type),
      INDEX idx_feedback_user (user_id),
      CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}


/**
 * Idempotent, information_schema-driven upgrades for databases created before
 * newer columns existed. This replaces blind "ALTER TABLE" statements that ran
 * on every boot and only performs work when something is genuinely missing.
 */
async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].total) > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  }
}

async function applySchemaUpgrades() {
  await ensureColumn("users", "total_xp", "total_xp INT NOT NULL DEFAULT 0");
  await ensureColumn("users", "target_weight", "target_weight DECIMAL(5,2)");
  await ensureColumn("users", "weight_kg", "weight_kg DECIMAL(5,2)");
  await ensureColumn("users", "preferred_workout_type", "preferred_workout_type VARCHAR(50)");
  await ensureColumn("users", "is_active", "is_active BOOLEAN NOT NULL DEFAULT TRUE");
  await ensureColumn(
    "users",
    "updated_at",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  );
  await ensureColumn("exercise_categories", "slug", "slug VARCHAR(80) UNIQUE");
  await ensureColumn("exercise_categories", "base_met", "base_met DECIMAL(4,2) NOT NULL DEFAULT 3.50");
  await ensureColumn(
    "exercise_categories",
    "xp_per_met_min",
    "xp_per_met_min DECIMAL(5,3) NOT NULL DEFAULT 0.200"
  );
  await ensureColumn(
    "exercise_categories",
    "created_at",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
  );
  await ensureColumn(
    "exercise_categories",
    "updated_at",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  );
  await ensureColumn("workouts", "calories_burned", "calories_burned INT");
  await ensureColumn("workouts", "calories", "calories INT");
  await ensureColumn("workouts", "xp", "xp INT NOT NULL DEFAULT 0");
  await ensureColumn("workouts", "intensity", "intensity ENUM('low','med','high') NOT NULL DEFAULT 'med'");
  await ensureColumn(
    "workouts",
    "calories_source",
    "calories_source ENUM('auto','manual') NOT NULL DEFAULT 'auto'"
  );
  await ensureColumn("workouts", "user_weight_at_log", "user_weight_at_log DECIMAL(5,2)");
  await ensureColumn("user_gamification", "next_level_xp", "next_level_xp INT NOT NULL DEFAULT 150");
  await ensureColumn("user_gamification", "last_active_date", "last_active_date DATE");
  await ensureColumn("user_gamification", "last_workout_date", "last_workout_date DATE");
  await ensureColumn("user_gamification", "weekly_freezes_used", "weekly_freezes_used INT NOT NULL DEFAULT 0");
  await ensureColumn("user_gamification", "streak_freeze_used", "streak_freeze_used BOOLEAN NOT NULL DEFAULT FALSE");
  await ensureColumn("user_gamification", "last_freeze_week", "last_freeze_week VARCHAR(16)");
  await ensureColumn("user_gamification", "weekly_streak", "weekly_streak INT NOT NULL DEFAULT 0");
  await ensureColumn("user_gamification", "weekly_longest_streak", "weekly_longest_streak INT NOT NULL DEFAULT 0");
  await ensureColumn("user_gamification", "streak_freezes", "streak_freezes TINYINT NOT NULL DEFAULT 2");
  await ensureColumn("user_gamification", "paid_restores_this_month", "paid_restores_this_month TINYINT NOT NULL DEFAULT 0");
  await ensureColumn("user_gamification", "last_freeze_reset", "last_freeze_reset DATE NULL");
  await ensureColumn("user_gamification", "last_counted_week_start", "last_counted_week_start DATE NULL");
  await ensureColumn("user_gamification", "at_risk_week_start", "at_risk_week_start DATE NULL");
  await ensureColumn("user_gamification", "restore_deadline", "restore_deadline DATETIME NULL");
  await ensureColumn("user_gamification", "streak_status", "streak_status ENUM('active', 'at_risk', 'broken') NOT NULL DEFAULT 'active'");

  await pool.query(`
    UPDATE user_gamification
    SET 
      weekly_streak = IF(COALESCE(weekly_streak, 0) = 0, COALESCE(current_streak, 0), weekly_streak),
      weekly_longest_streak = IF(COALESCE(weekly_longest_streak, 0) = 0, COALESCE(longest_streak, 0), weekly_longest_streak),
      streak_freezes = COALESCE(streak_freezes, 2),
      paid_restores_this_month = COALESCE(paid_restores_this_month, 0),
      streak_status = COALESCE(streak_status, 'active')
  `);

  await ensureColumn("achievements", "icon", "icon VARCHAR(80) NULL");
  await ensureColumn("achievements", "is_active", "is_active BOOLEAN NOT NULL DEFAULT TRUE");
  await ensureColumn("achievements", "updated_at", "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  await ensureColumn(
    "workouts",
    "updated_at",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  );

  await ensureColumn("workout_exercises", "activity_id", "activity_id VARCHAR(50) NULL");
  await ensureColumn("workout_exercises", "activity_slug", "activity_slug VARCHAR(100) NULL");
}

async function seedCategories() {
  const categories = [
    ["cat_cardio", "Cardio", "Running, cycling, rowing, walking, and swimming.", "cardio", 7.5, 0.18, false],
    ["cat_strength", "Strength", "Free weights, machines, bodyweight strength, and core lifts.", "strength", 6.0, 0.2, false],
    ["cat_hiit", "HIIT", "Intervals, circuits, bootcamp blocks, and high-output conditioning.", "hiit", 8.0, 0.22, false],
    ["cat_yoga", "Yoga", "Vinyasa, hatha, restorative yoga, and breath-led flow.", "yoga", 4.0, 0.25, false],
    ["cat_mobility", "Mobility", "Stretching, rehab drills, foam rolling, and joint prep.", "mobility", 2.8, 0.22, false],
    ["cat_sports", "Sports", "Basketball, soccer, tennis, climbing, and recreational games.", "sports", 7.0, 0.2, false]
  ];
  const categoryIds = categories.map((category) => category[0]);

  await pool.execute(
    `DELETE FROM exercise_categories WHERE id NOT IN (${categoryIds.map(() => "?").join(", ")})`,
    categoryIds
  );

  for (const category of categories) {
    await pool.execute(
      `INSERT INTO exercise_categories (id, name, description, slug, base_met, xp_per_met_min, is_custom)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         slug = VALUES(slug),
         base_met = VALUES(base_met),
         xp_per_met_min = VALUES(xp_per_met_min),
         is_custom = VALUES(is_custom)`,
      category
    );
  }
}

async function seedLevels() {
  // Cumulative XP thresholds derived from the logweb PDF (section 5):
  //   xpNeededForNextLevel = 100 + (level * 75) + (level^2 * 15)
  // Level 1=0, 2=190, 3=500, 4=960, 5=1600, 6=2450, 7=3540, 8=4900, 9=6560, 10=8550.
  // Titles/badge codes are preserved; only xp_required changes (safe upsert).
  const titles = [
    "Starter",
    "Warm Up",
    "Builder",
    "Regular",
    "Momentum",
    "Athlete",
    "Specialist",
    "Pro",
    "Elite",
    "Legend"
  ];
  const levels = titles.map((title, index) => {
    const levelNumber = index + 1;
    return [
      `lvl_${levelNumber}`,
      levelNumber,
      cumulativeXpForLevel(levelNumber),
      `level_${levelNumber}`,
      title
    ];
  });

  for (const level of levels) {
    await pool.execute(
      `INSERT INTO levels (id, level_number, xp_required, badge_unlock, title)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         xp_required = VALUES(xp_required),
         badge_unlock = VALUES(badge_unlock),
         title = VALUES(title)`,
      level
    );
  }
}


async function seedAchievements() {
  const achievements = [
    ["streak_3", "Three Day Start", "Maintained a 3-day activity streak.", "streak", 3, 1],
    ["streak_7", "One Week Streak", "Maintained a 7-day activity streak.", "streak", 7, 2],
    ["streak_14", "Two Week Habit", "Maintained a 14-day activity streak.", "streak", 14, 3],
    ["streak_30", "Thirty Day Streak", "Maintained a 30-day activity streak.", "streak", 30, 4]
  ];

  for (const achievement of achievements) {
    await pool.execute(
      `INSERT INTO achievements (code, name, description, requirement_type, requirement_value, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         requirement_type = VALUES(requirement_type),
         requirement_value = VALUES(requirement_value),
         sort_order = VALUES(sort_order)`,
      achievement
    );
  }
}

async function seedUsers() {
  const adminPasswordHash = bcryptjs.hashSync("admin123", 10);
  const userPasswordHash = bcryptjs.hashSync("fitness123", 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await pool.execute(
    `INSERT IGNORE INTO users (id, email, name, role, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    ["usr_admin", "admin@fitsync.com", "Alex Roberts (Admin)", "admin", adminPasswordHash]
  );

  await pool.execute(
    `INSERT IGNORE INTO users (
       id, email, name, role, password_hash, age, gender, height, weight, weight_kg, target_weight,
       preferred_workout_type, goal, activity_level, created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "usr_demo",
      "user@fitsync.com",
      "Sarah Coleman",
      "user",
      userPasswordHash,
      28,
      "female",
      168.0,
      65.0,
      65.0,
      62.0,
      "Strength",
      "Lose weight & Tone muscle",
      "Moderately active",
      toMysqlDateTime(thirtyDaysAgo)
    ]
  );

  await pool.execute(
    `INSERT IGNORE INTO user_gamification (user_id, total_xp, level, next_level_xp)
     SELECT id, 0, 1, 150 FROM users`
  );
}

async function seedWeightLogs(today) {
  const weightTrend = [
    { offsetDays: 14, weight: 66.8, notes: "Starting weight for tracker" },
    { offsetDays: 10, weight: 66.2, notes: "Weight tracking milestone" },
    { offsetDays: 7, weight: 65.7, notes: "Weight tracking milestone" },
    { offsetDays: 3, weight: 65.3, notes: "Weight tracking milestone" },
    { offsetDays: 0, weight: 65.0, notes: "Weight tracking milestone" }
  ];

  for (let i = 0; i < weightTrend.length; i += 1) {
    const record = weightTrend[i];
    const recordDate = new Date(today);
    recordDate.setDate(today.getDate() - record.offsetDays);
    const bmi = Number((record.weight / (1.68 * 1.68)).toFixed(1));

    await pool.execute(
      `INSERT IGNORE INTO weight_logs (id, user_id, date, weight, bmi, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `w_demo_${i}`,
        "usr_demo",
        toMysqlDate(recordDate),
        record.weight,
        bmi,
        record.notes,
        toMysqlDateTime(recordDate)
      ]
    );
  }
}

async function seedWorkouts(today) {
  const sampleWorkouts = [
    {
      id: "wk_demo_0",
      title: "Monday Energizing Jog",
      offsetDays: 12,
      notes: "Outdoor track, felt very fresh",
      exercises: [
        {
          id: "ex_seed_1",
          categoryId: "cat_cardio",
          categoryName: "Cardio",
          exerciseName: "Jogging / Running",
          duration: 35,
          caloriesBurned: 320,
          sets: [{ reps: 1, weight: 0.0 }]
        }
      ]
    },
    {
      id: "wk_demo_1",
      title: "Upper-Body Strength Progress",
      offsetDays: 10,
      notes: "Focusing on form and hypertrophy",
      exercises: [
        {
          id: "ex_seed_2",
          categoryId: "cat_strength",
          categoryName: "Strength",
          exerciseName: "Shoulder press & Rows",
          duration: 40,
          caloriesBurned: 240,
          sets: [
            { reps: 10, weight: 15.0 },
            { reps: 10, weight: 15.0 },
            { reps: 8, weight: 17.5 }
          ]
        }
      ]
    },
    {
      id: "wk_demo_2",
      title: "Active Recovery & Stretching",
      offsetDays: 8,
      notes: "Gentle flow to address hamstring soreness",
      exercises: [
        {
          id: "ex_seed_3",
          categoryId: "cat_yoga",
          categoryName: "Yoga",
          exerciseName: "Flow Stretch session",
          duration: 25,
          caloriesBurned: 80,
          sets: [{ reps: 1, weight: 0.0 }]
        }
      ]
    },
    {
      id: "wk_demo_3",
      title: "Full Body Circuit Blast",
      offsetDays: 5,
      notes: "Strong calorie burn. Peak heart rate 174",
      exercises: [
        {
          id: "ex_seed_4",
          categoryId: "cat_hiit",
          categoryName: "HIIT",
          exerciseName: "High rep calisthenics circuit",
          duration: 30,
          caloriesBurned: 290,
          sets: [
            { reps: 15, weight: 0.0 },
            { reps: 15, weight: 0.0 },
            { reps: 15, weight: 0.0 }
          ]
        }
      ]
    },
    {
      id: "wk_demo_4",
      title: "Tempo Running Session",
      offsetDays: 2,
      notes: "Pace: 5:45/km. Felt slightly tough towards the 4th km.",
      exercises: [
        {
          id: "ex_seed_5",
          categoryId: "cat_cardio",
          categoryName: "Cardio",
          exerciseName: "Outdoor Road Run",
          duration: 42,
          caloriesBurned: 410,
          sets: [{ reps: 1, weight: 0.0 }]
        }
      ]
    }
  ];

  for (const workout of sampleWorkouts) {
    const workoutDate = new Date(today);
    workoutDate.setDate(today.getDate() - workout.offsetDays);
    const totalDuration = workout.exercises.reduce((sum, exercise) => sum + exercise.duration, 0);
    const totalCalories = workout.exercises.reduce(
      (sum, exercise) => sum + exercise.caloriesBurned,
      0
    );

    await pool.execute(
      `INSERT IGNORE INTO workouts (id, user_id, date, title, duration_total, calories_total, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workout.id,
        "usr_demo",
        toMysqlDate(workoutDate),
        workout.title,
        totalDuration,
        totalCalories,
        workout.notes,
        toMysqlDateTime(workoutDate)
      ]
    );

    for (const exercise of workout.exercises) {
      await pool.execute(
        `INSERT IGNORE INTO workout_exercises (
           id, workout_id, category_id, category_name, exercise_name, duration, calories_burned
         )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          exercise.id,
          workout.id,
          exercise.categoryId,
          exercise.categoryName,
          exercise.exerciseName,
          exercise.duration,
          exercise.caloriesBurned
        ]
      );

      for (const set of exercise.sets) {
        const [existingRows] = await pool.execute(
          "SELECT id FROM workout_sets WHERE exercise_id = ? AND reps = ? AND weight = ? LIMIT 1",
          [exercise.id, set.reps, set.weight]
        );

        if (existingRows.length === 0) {
          await pool.execute(
            "INSERT INTO workout_sets (exercise_id, reps, weight) VALUES (?, ?, ?)",
            [exercise.id, set.reps, set.weight]
          );
        }
      }
    }
  }
}

async function seedInsight(today) {
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  const recommendations = [
    "Incorporate one additional low-intensity cardio session to build a stronger stamina base.",
    "Sustain hydration habits by aiming for around 2.4 liters of water daily.",
    "Next strength workout, try increasing row reps by 2 to support muscular tone progression."
  ];

  await pool.execute(
    `INSERT IGNORE INTO ai_insights (
       id, user_id, date_generated, start_date, end_date, workout_count, total_calories,
       total_minutes, bmi_value, current_weight, summary, recommendations, goal_progress
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "ins_demo_1",
      "usr_demo",
      toMysqlDate(today),
      toMysqlDate(startDate),
      toMysqlDate(today),
      3,
      780,
      97,
      23.0,
      65.3,
      "You kept good routine consistency this past week with 3 logged sessions. Your weight records showed healthy downward progress and your training split favored efficient circuits.",
      JSON.stringify(recommendations),
      "On track toward your target. Body weight is trending down at a safe pace with good routine compliance."
    ]
  );
}

async function seedActivityLibrary() {
  const { ACTIVITY_LIBRARY } = require("../data/activityLibrary");

  for (const activity of ACTIVITY_LIBRARY) {
    await pool.execute(
      `INSERT INTO activity_library (
         id, slug, name, category_slug, category_id, description, base_met, intensity_level,
         calorie_method, pace_profile, supports_distance, supports_duration,
         supports_sets_reps_weight, supports_bodyweight, supports_reps_only, supports_hold_time,
         distance_multiplier, bodyweight_factor, volume_modifier_min, volume_modifier_max,
         default_duration_min, equipment, primary_muscles, secondary_muscles, tracking_fields,
         calculation_notes, sort_order, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         category_slug = VALUES(category_slug),
         category_id = VALUES(category_id),
         description = VALUES(description),
         base_met = VALUES(base_met),
         intensity_level = VALUES(intensity_level),
         calorie_method = VALUES(calorie_method),
         pace_profile = VALUES(pace_profile),
         supports_distance = VALUES(supports_distance),
         supports_duration = VALUES(supports_duration),
         supports_sets_reps_weight = VALUES(supports_sets_reps_weight),
         supports_bodyweight = VALUES(supports_bodyweight),
         supports_reps_only = VALUES(supports_reps_only),
         supports_hold_time = VALUES(supports_hold_time),
         distance_multiplier = VALUES(distance_multiplier),
         bodyweight_factor = VALUES(bodyweight_factor),
         volume_modifier_min = VALUES(volume_modifier_min),
         volume_modifier_max = VALUES(volume_modifier_max),
         default_duration_min = VALUES(default_duration_min),
         equipment = VALUES(equipment),
         primary_muscles = VALUES(primary_muscles),
         secondary_muscles = VALUES(secondary_muscles),
         tracking_fields = VALUES(tracking_fields),
         calculation_notes = VALUES(calculation_notes),
         sort_order = VALUES(sort_order),
         is_active = VALUES(is_active)`,
      [
        activity.id,
        activity.slug,
        activity.name,
        activity.categorySlug,
        activity.categoryId,
        activity.description,
        activity.baseMet,
        activity.intensityLevel,
        activity.calorieMethod,
        activity.paceProfile,
        activity.supportsDistance,
        activity.supportsDuration,
        activity.supportsSetsRepsWeight,
        activity.supportsBodyweight,
        activity.supportsRepsOnly,
        activity.supportsHoldTime,
        activity.distanceMultiplier,
        activity.bodyweightFactor,
        activity.volumeModifierMin,
        activity.volumeModifierMax,
        activity.defaultDurationMin,
        activity.equipment,
        activity.primaryMuscles,
        activity.secondaryMuscles,
        JSON.stringify(activity.trackingFields || []),
        activity.calculationNotes,
        activity.sortOrder,
        activity.isActive
      ]
    );
  }
}

async function seedNutritionFoods() {
  const { loadNutritionFoods } = require("../data/nutritionFoodDataset");
  const foods = loadNutritionFoods();

  for (const food of foods) {
    await pool.execute(
      `INSERT INTO nutrition_foods (
         id, name, serving_size, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
         sodium_mg, food_type, diet_tags, source_dataset, source_file, source_group, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         serving_size = VALUES(serving_size),
         calories = VALUES(calories),
         protein_g = VALUES(protein_g),
         carbs_g = VALUES(carbs_g),
         fat_g = VALUES(fat_g),
         fiber_g = VALUES(fiber_g),
         sugar_g = VALUES(sugar_g),
         sodium_mg = VALUES(sodium_mg),
         food_type = VALUES(food_type),
         diet_tags = VALUES(diet_tags),
         source_dataset = VALUES(source_dataset),
         source_file = VALUES(source_file),
         source_group = VALUES(source_group),
         is_active = TRUE`,
      [
        food.id,
        food.name,
        food.servingSize,
        food.calories,
        food.proteinG,
        food.carbsG,
        food.fatG,
        food.fiberG,
        food.sugarG,
        food.sodiumMg,
        food.foodType,
        JSON.stringify(food.dietTags || []),
        food.sourceDataset,
        food.sourceFile,
        food.sourceGroup
      ]
    );
  }
}

async function seedDefaults() {
  const today = new Date();

  await seedCategories();
  await seedActivityLibrary();
  await seedNutritionFoods();
  await seedLevels();
  await seedAchievements();
  await seedUsers();
  await seedWeightLogs(today);
  await seedWorkouts(today);
  await seedInsight(today);
}

async function initializeDatabase() {
  await ensureDatabaseExists();
  await createTables();
  await applySchemaUpgrades();
  await seedDefaults();
}

module.exports = { initializeDatabase };

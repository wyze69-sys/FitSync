const bcryptjs = require("bcryptjs");
const mysql = require("mysql2/promise");
const pool = require("../config/db");

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
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      password_hash VARCHAR(255) NOT NULL,
      age INT,
      gender VARCHAR(50),
      height DECIMAL(5,2),
      weight DECIMAL(5,2),
      goal VARCHAR(255) DEFAULT 'Maintain fitness',
      activity_level VARCHAR(255) DEFAULT 'Sedentary',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exercise_categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT NOT NULL,
      is_custom BOOLEAN NOT NULL DEFAULT FALSE
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
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id VARCHAR(50) PRIMARY KEY,
      workout_id VARCHAR(50) NOT NULL,
      category_id VARCHAR(50),
      category_name VARCHAR(255),
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
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      goal_progress VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function seedCategories() {
  const categories = [
    ["cat_1", "Cardio Training", "Running, running tracks, jogging, cycling, walking, and swimming.", false],
    ["cat_2", "Strength & Core", "Gym weight machines, free dumbbells, barbell lifts, and core training.", false],
    ["cat_3", "Flexibility & Yoga", "Stretching, standard yoga, and body recovery movements.", false],
    ["cat_4", "HIIT & Circuit", "High-intensity interval training, fast calisthenics, and active circuit routines.", false],
    ["cat_5", "Hybrid Wellness", "Mixed cardio and strength routines in a single training block.", false]
  ];

  for (const category of categories) {
    await pool.execute(
      `INSERT IGNORE INTO exercise_categories (id, name, description, is_custom)
       VALUES (?, ?, ?, ?)`,
      category
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
       id, email, name, role, password_hash, age, gender, height, weight, goal, activity_level, created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      "Lose weight & Tone muscle",
      "Moderately active",
      toMysqlDateTime(thirtyDaysAgo)
    ]
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
      [`w_demo_${i}`, "usr_demo", toMysqlDate(recordDate), record.weight, bmi, record.notes, toMysqlDateTime(recordDate)]
    );
  }
}

async function seedWorkouts(today) {
  const sampleWorkouts = [
    {
      id: "wk_demo_0",
      title: "Monday Energizing Jog",
      offsetDays: 12,
      notes: "Outdoors track, felt very fresh",
      exercises: [
        {
          id: "ex_seed_1",
          categoryId: "cat_1",
          categoryName: "Cardio Training",
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
          categoryId: "cat_2",
          categoryName: "Strength & Core",
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
          categoryId: "cat_3",
          categoryName: "Flexibility & Yoga",
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
      notes: "Incredible calorie burner. Peak heart rate 174",
      exercises: [
        {
          id: "ex_seed_4",
          categoryId: "cat_4",
          categoryName: "HIIT & Circuit",
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
          categoryId: "cat_1",
          categoryName: "Cardio Training",
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
    const totalCalories = workout.exercises.reduce((sum, exercise) => sum + exercise.caloriesBurned, 0);

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
    "Incorporate one additional low-intensity cardio session to promote a stronger stamina base.",
    "Sustain hydration habits by aiming for 2.4 liters of water daily.",
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
      "You maintained excellent routine consistency this past week with 3 logged sessions. Your weight records showed healthy downward progress and your training split favored efficient circuits.",
      JSON.stringify(recommendations),
      "On track to target. Body mass indicators show safe pacing with excellent routine compliance."
    ]
  );
}

async function seedDefaults() {
  const today = new Date();

  await seedCategories();
  await seedUsers();
  await seedWeightLogs(today);
  await seedWorkouts(today);
  await seedInsight(today);
}

async function initializeDatabase() {
  await ensureDatabaseExists();
  await createTables();
  await seedDefaults();
}

module.exports = { initializeDatabase };

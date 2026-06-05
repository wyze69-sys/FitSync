const pool = require("../config/db");
const { createId } = require("../utils/ids");
const { formatDate, formatTimestamp } = require("../utils/rowMappers");

function placeholders(values) {
  return values.map(() => "?").join(", ");
}

async function loadExercisesForWorkouts(workoutIds, executor = pool) {
  if (workoutIds.length === 0) return new Map();

  const [exerciseRows] = await executor.execute(
    `SELECT * FROM workout_exercises WHERE workout_id IN (${placeholders(workoutIds)})`,
    workoutIds
  );

  const exerciseIds = exerciseRows.map((row) => row.id);
  let setRows = [];

  if (exerciseIds.length > 0) {
    const [rows] = await executor.execute(
      `SELECT * FROM workout_sets WHERE exercise_id IN (${placeholders(exerciseIds)}) ORDER BY id ASC`,
      exerciseIds
    );
    setRows = rows;
  }

  const setsByExerciseId = new Map();
  for (const row of setRows) {
    const currentSets = setsByExerciseId.get(row.exercise_id) || [];
    currentSets.push({
      reps: Number(row.reps),
      weight: Number(row.weight)
    });
    setsByExerciseId.set(row.exercise_id, currentSets);
  }

  const exercisesByWorkoutId = new Map();
  for (const row of exerciseRows) {
    const currentExercises = exercisesByWorkoutId.get(row.workout_id) || [];
    currentExercises.push({
      id: row.id,
      categoryId: row.category_id || "",
      categoryName: row.category_name || "",
      exerciseName: row.exercise_name,
      duration: Number(row.duration),
      caloriesBurned: Number(row.calories_burned),
      sets: setsByExerciseId.get(row.id) || []
    });
    exercisesByWorkoutId.set(row.workout_id, currentExercises);
  }

  return exercisesByWorkoutId;
}

async function hydrateWorkouts(workoutRows, executor = pool) {
  const workoutIds = workoutRows.map((row) => row.id);
  const exercisesByWorkoutId = await loadExercisesForWorkouts(workoutIds, executor);

  return workoutRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    date: formatDate(row.date),
    title: row.title,
    durationTotal: Number(row.duration_total),
    caloriesTotal: Number(row.calories_total),
    caloriesBurned: row.calories_burned === null || row.calories_burned === undefined ? Number(row.calories_total) : Number(row.calories_burned),
    caloriesSource: row.calories_source || "manual",
    userWeightAtLog: row.user_weight_at_log === null || row.user_weight_at_log === undefined ? undefined : Number(row.user_weight_at_log),
    notes: row.notes || undefined,
    exercises: exercisesByWorkoutId.get(row.id) || [],
    createdAt: formatTimestamp(row.created_at)
  }));
}

const SORT_OPTIONS = {
  date_desc: "date DESC, created_at DESC",
  date_asc: "date ASC, created_at ASC",
  calories_desc: "calories_total DESC, date DESC",
  duration_desc: "duration_total DESC, date DESC"
};

/**
 * List a user's workouts with optional filtering, sorting and pagination.
 * Returns { items, total, page, limit, totalPages }.
 */
async function getWorkoutsByUserId(userId, filters = {}) {
  const conditions = ["w.user_id = ?"];
  const params = [userId];

  if (filters.category) {
    // Match workouts that contain at least one exercise in the given category.
    conditions.push(
      "EXISTS (SELECT 1 FROM workout_exercises we WHERE we.workout_id = w.id AND we.category_id = ?)"
    );
    params.push(filters.category);
  }
  if (filters.search) {
    conditions.push("(w.title LIKE ? OR w.notes LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.from) {
    conditions.push("w.date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push("w.date <= ?");
    params.push(filters.to);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const orderBy = SORT_OPTIONS[filters.sort] || SORT_OPTIONS.date_desc;

  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM workouts w ${whereClause}`,
    params
  );
  const total = Number(countRow.total);

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT w.* FROM workouts w ${whereClause} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const items = await hydrateWorkouts(rows);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

async function getWorkoutById(id) {
  const [rows] = await pool.execute("SELECT * FROM workouts WHERE id = ?", [id]);
  if (rows.length === 0) return undefined;

  const workouts = await hydrateWorkouts(rows);
  return workouts[0];
}

async function insertExercises(executor, workoutId, exercises) {
  for (let index = 0; index < exercises.length; index += 1) {
    const exercise = exercises[index];
    const exerciseId = exercise.id || `ex_${index}_${Date.now()}`;

    await executor.execute(
      `INSERT INTO workout_exercises (
         id, workout_id, category_id, category_name, exercise_name, duration, calories_burned
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        exerciseId,
        workoutId,
        exercise.categoryId || null,
        exercise.categoryName || null,
        exercise.exerciseName,
        exercise.duration,
        exercise.caloriesBurned
      ]
    );

    for (const set of exercise.sets || []) {
      await executor.execute(
        "INSERT INTO workout_sets (exercise_id, reps, weight) VALUES (?, ?, ?)",
        [exerciseId, set.reps, set.weight]
      );
    }
  }
}

async function createWorkout(workout) {
  const id = createId("wk");
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO workouts (id, user_id, date, title, duration_total, calories_total, calories_burned, calories_source, user_weight_at_log, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        workout.userId,
        workout.date,
        workout.title,
        workout.durationTotal,
        workout.caloriesTotal,
        workout.caloriesBurned ?? workout.caloriesTotal,
        workout.caloriesSource || "manual",
        workout.userWeightAtLog || null,
        workout.notes || null
      ]
    );

    await insertExercises(connection, id, workout.exercises || []);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return getWorkoutById(id);
}

async function updateWorkout(id, updates) {
  const existing = await getWorkoutById(id);
  if (!existing) {
    throw new Error("Workout not found");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const fields = [];
    const values = [];

    if (updates.date !== undefined) {
      fields.push("date = ?");
      values.push(updates.date);
    }
    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.notes !== undefined) {
      fields.push("notes = ?");
      values.push(updates.notes);
    }
    if (updates.durationTotal !== undefined) {
      fields.push("duration_total = ?");
      values.push(updates.durationTotal);
    }
    if (updates.caloriesTotal !== undefined) {
      fields.push("calories_total = ?");
      values.push(updates.caloriesTotal);
    }

    if (fields.length > 0) {
      values.push(id);
      await connection.execute(`UPDATE workouts SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    if (updates.exercises !== undefined) {
      await connection.execute("DELETE FROM workout_exercises WHERE workout_id = ?", [id]);
      await insertExercises(connection, id, updates.exercises || []);
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return getWorkoutById(id);
}

async function deleteWorkout(id, userId) {
  const [result] = await pool.execute("DELETE FROM workouts WHERE id = ? AND user_id = ?", [
    id,
    userId
  ]);
  return result.affectedRows > 0;
}

module.exports = {
  workoutRepository: {
    getWorkoutsByUserId,
    getWorkoutById,
    createWorkout,
    updateWorkout,
    deleteWorkout
  }
};

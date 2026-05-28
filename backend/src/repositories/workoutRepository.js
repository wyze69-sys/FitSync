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
    notes: row.notes || undefined,
    exercises: exercisesByWorkoutId.get(row.id) || [],
    createdAt: formatTimestamp(row.created_at)
  }));
}

async function getWorkoutsByUserId(userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, created_at DESC",
    [userId]
  );
  return hydrateWorkouts(rows);
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
      `INSERT INTO workouts (id, user_id, date, title, duration_total, calories_total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        workout.userId,
        workout.date,
        workout.title,
        workout.durationTotal,
        workout.caloriesTotal,
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

async function deleteWorkout(id) {
  const [result] = await pool.execute("DELETE FROM workouts WHERE id = ?", [id]);
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

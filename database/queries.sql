USE fitsync_db;

-- User lookup
SELECT * FROM users WHERE LOWER(email) = LOWER(?);

-- User workouts with exercise and set rows
SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, created_at DESC;
SELECT * FROM workout_exercises WHERE workout_id IN (?);
SELECT * FROM workout_sets WHERE exercise_id IN (?) ORDER BY id ASC;

-- Weight history
SELECT * FROM weight_logs WHERE user_id = ? ORDER BY date DESC, created_at DESC;

-- AI insight history
SELECT * FROM ai_insights WHERE user_id = ? ORDER BY created_at DESC;

-- Admin totals
SELECT COUNT(*) AS total FROM users WHERE role <> 'admin';
SELECT COUNT(*) AS total FROM workouts;
SELECT COUNT(*) AS total FROM weight_logs;
SELECT COUNT(*) AS total FROM ai_insights;

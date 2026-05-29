USE fitsync_db;

-- ----------------------------------------------------------------------------
-- Reference of the main SQL queries used by the FitSync backend repositories.
-- All application queries are parameterized (prepared statements) in code.
-- ----------------------------------------------------------------------------

-- Authentication / users
SELECT * FROM users WHERE LOWER(email) = LOWER(?);
SELECT * FROM users WHERE id = ?;

-- Admin: user listing with optional search/role/status filters and activity counts
SELECT u.*, 
       (SELECT COUNT(*) FROM workouts w WHERE w.user_id = u.id) AS workout_count,
       (SELECT COUNT(*) FROM weight_logs wl WHERE wl.user_id = u.id) AS weight_count
FROM users u
WHERE (u.name LIKE ? OR u.email LIKE ?)
ORDER BY u.created_at DESC;

-- Admin: change a user's role / active status
UPDATE users SET role = ? WHERE id = ?;
UPDATE users SET is_active = ? WHERE id = ?;

-- Workouts with exercise and set rows (hydrated in the repository layer)
SELECT w.* FROM workouts w
WHERE w.user_id = ? AND w.date >= ? AND w.date <= ?
ORDER BY w.date DESC, w.created_at DESC
LIMIT ? OFFSET ?;
SELECT * FROM workout_exercises WHERE workout_id IN (?);
SELECT * FROM workout_sets WHERE exercise_id IN (?) ORDER BY id ASC;

-- Workout filter by category (workouts containing an exercise in a category)
SELECT w.* FROM workouts w
WHERE w.user_id = ?
  AND EXISTS (SELECT 1 FROM workout_exercises we WHERE we.workout_id = w.id AND we.category_id = ?);

-- Ownership-scoped deletes (defense in depth)
DELETE FROM workouts WHERE id = ? AND user_id = ?;
DELETE FROM weight_logs WHERE id = ? AND user_id = ?;

-- Weight history
SELECT * FROM weight_logs WHERE user_id = ? ORDER BY date DESC, created_at DESC;

-- AI insight history
SELECT * FROM ai_insights WHERE user_id = ? ORDER BY created_at DESC;

-- Gamification: combined activity dates (workouts + weight logs + check-ins)
SELECT date FROM workouts WHERE user_id = ?
UNION SELECT date FROM weight_logs WHERE user_id = ?
UNION SELECT date FROM daily_checkins WHERE user_id = ?;

-- Gamification: record a daily check-in (one per user per day)
INSERT IGNORE INTO daily_checkins (id, user_id, date, type) VALUES (?, ?, ?, ?);

-- Gamification: persist a user's streak (insert or update)
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    current_streak = VALUES(current_streak),
    longest_streak = GREATEST(longest_streak, VALUES(longest_streak)),
    last_active_date = VALUES(last_active_date);

-- Admin totals
SELECT COUNT(*) AS total FROM users WHERE role <> 'admin';
SELECT COUNT(*) AS total FROM workouts;
SELECT COUNT(*) AS total FROM weight_logs;
SELECT COUNT(*) AS total FROM ai_insights;

-- Admin: category usage analytics
SELECT c.id, c.name, c.is_custom,
       COUNT(we.id) AS usage_count,
       COALESCE(SUM(we.duration), 0) AS total_minutes,
       COALESCE(SUM(we.calories_burned), 0) AS total_calories
FROM exercise_categories c
LEFT JOIN workout_exercises we ON we.category_id = c.id
GROUP BY c.id, c.name, c.is_custom
ORDER BY usage_count DESC, c.name ASC;

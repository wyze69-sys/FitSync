USE fitsync_db;

-- Default exercise categories (also seeded automatically by the backend).
INSERT IGNORE INTO exercise_categories (id, name, description, is_custom) VALUES
('cat_1', 'Cardio Training', 'Running, jogging, cycling, walking, and swimming.', FALSE),
('cat_2', 'Strength & Core', 'Gym weight machines, free dumbbells, barbell lifts, and core training.', FALSE),
('cat_3', 'Flexibility & Yoga', 'Stretching, standard yoga, and body recovery movements.', FALSE),
('cat_4', 'HIIT & Circuit', 'High-intensity interval training, fast calisthenics, and active circuit routines.', FALSE),
('cat_5', 'Hybrid Wellness', 'Mixed cardio and strength routines in a single training block.', FALSE);

-- Achievement (badge) catalog used by the gamification/streak system.
INSERT INTO achievements (code, name, description, requirement_type, requirement_value, sort_order) VALUES
('streak_3', 'Three Day Start', 'Maintained a 3-day activity streak.', 'streak', 3, 1),
('streak_7', 'One Week Streak', 'Maintained a 7-day activity streak.', 'streak', 7, 2),
('streak_14', 'Two Week Habit', 'Maintained a 14-day activity streak.', 'streak', 14, 3),
('streak_30', 'Thirty Day Streak', 'Maintained a 30-day activity streak.', 'streak', 30, 4)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    requirement_type = VALUES(requirement_type),
    requirement_value = VALUES(requirement_value),
    sort_order = VALUES(sort_order);

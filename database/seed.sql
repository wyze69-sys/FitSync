USE fitsync_db;

INSERT IGNORE INTO exercise_categories (id, name, description, is_custom) VALUES
('cat_1', 'Cardio Training', 'Running, running tracks, jogging, cycling, walking, and swimming.', FALSE),
('cat_2', 'Strength & Core', 'Gym weight machines, free dumbbells, barbell lifts, and core training.', FALSE),
('cat_3', 'Flexibility & Yoga', 'Stretching, standard yoga, and body recovery movements.', FALSE),
('cat_4', 'HIIT & Circuit', 'High-intensity interval training, fast calisthenics, and active circuit routines.', FALSE),
('cat_5', 'Hybrid Wellness', 'Mixed cardio and strength routines in a single training block.', FALSE);

USE fitsync_db;

-- Production workout category catalog. Keep this list to exactly six defaults.
DELETE FROM exercise_categories
WHERE id NOT IN ('cat_cardio', 'cat_strength', 'cat_hiit', 'cat_yoga', 'cat_mobility', 'cat_sports');

INSERT INTO exercise_categories (id, name, description, slug, base_met, xp_per_met_min, is_custom) VALUES
('cat_cardio', 'Cardio', 'Running, cycling, rowing, walking, and swimming.', 'cardio', 7.50, 0.180, FALSE),
('cat_strength', 'Strength', 'Free weights, machines, bodyweight strength, and core lifts.', 'strength', 6.00, 0.200, FALSE),
('cat_hiit', 'HIIT', 'Intervals, circuits, bootcamp blocks, and high-output conditioning.', 'hiit', 8.00, 0.220, FALSE),
('cat_yoga', 'Yoga', 'Vinyasa, hatha, restorative yoga, and breath-led flow.', 'yoga', 4.00, 0.250, FALSE),
('cat_mobility', 'Mobility', 'Stretching, rehab drills, foam rolling, and joint prep.', 'mobility', 2.80, 0.220, FALSE),
('cat_sports', 'Sports', 'Basketball, soccer, tennis, climbing, and recreational games.', 'sports', 7.00, 0.200, FALSE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    slug = VALUES(slug),
    base_met = VALUES(base_met),
    xp_per_met_min = VALUES(xp_per_met_min),
    is_custom = FALSE;

INSERT INTO levels (id, level_number, xp_required, badge_unlock, title) VALUES
('lvl_1', 1, 0, 'level_1', 'Starter'),
('lvl_2', 2, 150, 'level_2', 'Warm Up'),
('lvl_3', 3, 350, 'level_3', 'Builder'),
('lvl_4', 4, 600, 'level_4', 'Regular'),
('lvl_5', 5, 900, 'level_5', 'Momentum'),
('lvl_6', 6, 1250, 'level_6', 'Athlete'),
('lvl_7', 7, 1650, 'level_7', 'Specialist'),
('lvl_8', 8, 2100, 'level_8', 'Pro'),
('lvl_9', 9, 2600, 'level_9', 'Elite'),
('lvl_10', 10, 3150, 'level_10', 'Legend')
ON DUPLICATE KEY UPDATE
    xp_required = VALUES(xp_required),
    badge_unlock = VALUES(badge_unlock),
    title = VALUES(title);

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

-- Migration 0004: XP system, levels, and production workout categories.

USE fitsync_db;

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
DELIMITER $$
CREATE PROCEDURE add_column_if_missing(
  IN table_name_in VARCHAR(64),
  IN column_name_in VARCHAR(64),
  IN column_definition_in TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_in
      AND COLUMN_NAME = column_name_in
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', table_name_in, '` ADD COLUMN ', column_definition_in);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

CREATE PROCEDURE add_index_if_missing(
  IN table_name_in VARCHAR(64),
  IN index_name_in VARCHAR(64),
  IN index_definition_in TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_in
      AND INDEX_NAME = index_name_in
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', table_name_in, '` ADD INDEX ', index_definition_in);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_column_if_missing('workouts', 'calories', 'calories INT NULL AFTER calories_total');
CALL add_column_if_missing('workouts', 'xp', 'xp INT NOT NULL DEFAULT 0 AFTER calories');
CALL add_column_if_missing('workouts', 'intensity', 'intensity ENUM(''low'',''med'',''high'') NOT NULL DEFAULT ''med'' AFTER xp');
CALL add_column_if_missing('users', 'total_xp', 'total_xp INT NOT NULL DEFAULT 0 AFTER weight_kg');
CALL add_column_if_missing('exercise_categories', 'slug', 'slug VARCHAR(80) UNIQUE AFTER description');
CALL add_column_if_missing('exercise_categories', 'base_met', 'base_met DECIMAL(4,2) NOT NULL DEFAULT 3.50 AFTER slug');
CALL add_column_if_missing('exercise_categories', 'xp_per_met_min', 'xp_per_met_min DECIMAL(5,3) NOT NULL DEFAULT 0.200 AFTER base_met');
CALL add_index_if_missing('workouts', 'idx_workouts_user_date', 'idx_workouts_user_date (user_id, date)');

CREATE TABLE IF NOT EXISTS levels (
  id VARCHAR(50) PRIMARY KEY,
  level_number INT NOT NULL UNIQUE,
  xp_required INT NOT NULL,
  badge_unlock VARCHAR(50),
  title VARCHAR(255) NOT NULL
);

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

UPDATE workouts SET calories = COALESCE(calories, calories_total), xp = COALESCE(xp, 0);
UPDATE users u
LEFT JOIN (
  SELECT user_id, COALESCE(SUM(xp), 0) AS earned_xp
  FROM workouts
  GROUP BY user_id
) totals ON totals.user_id = u.id
SET u.total_xp = COALESCE(u.total_xp, totals.earned_xp, 0);

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;

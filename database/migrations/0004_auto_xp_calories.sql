-- Migration 0004: Auto XP and calories for FitSync v2.
-- Adds MET-backed workout categories, automatic calorie fields, and XP ledger tables.

USE fitsync_db;

DROP PROCEDURE IF EXISTS add_column_if_missing;
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
DELIMITER ;

CALL add_column_if_missing('users', 'weight_kg', 'weight_kg DECIMAL(5,2) NULL AFTER weight');
CALL add_column_if_missing('workouts', 'calories_burned', 'calories_burned INT NULL AFTER calories_total');
CALL add_column_if_missing('workouts', 'calories_source', 'calories_source ENUM(''auto'',''manual'') NOT NULL DEFAULT ''auto'' AFTER calories_burned');
CALL add_column_if_missing('workouts', 'user_weight_at_log', 'user_weight_at_log DECIMAL(5,2) NULL AFTER calories_source');
CALL add_column_if_missing('exercise_categories', 'slug', 'slug VARCHAR(80) NULL AFTER description');
CALL add_column_if_missing('exercise_categories', 'base_met', 'base_met DECIMAL(4,2) NOT NULL DEFAULT 3.50 AFTER slug');
CALL add_column_if_missing('exercise_categories', 'xp_per_met_min', 'xp_per_met_min DECIMAL(5,3) NOT NULL DEFAULT 0.200 AFTER base_met');

DROP PROCEDURE IF EXISTS add_column_if_missing;

CREATE TABLE IF NOT EXISTS user_gamification (
  user_id VARCHAR(50) PRIMARY KEY,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  next_level_xp INT NOT NULL DEFAULT 500,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  weekly_freezes_used INT NOT NULL DEFAULT 0,
  last_freeze_week VARCHAR(16),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

INSERT INTO exercise_categories (id, name, description, slug, base_met, xp_per_met_min, is_custom) VALUES
('cat_running','Running','Outdoor or treadmill running.','running',9.8,0.18,FALSE),
('cat_cycling','Cycling','Road, indoor, or casual cycling.','cycling',7.5,0.18,FALSE),
('cat_walking','Walking','Brisk walks and low-impact cardio.','walking',3.5,0.20,FALSE),
('cat_swimming','Swimming','Pool or open-water swimming.','swimming',8.0,0.18,FALSE),
('cat_chest','Chest','Chest-focused strength training.','chest',6.0,0.20,FALSE),
('cat_back','Back','Back-focused strength training.','back',6.0,0.20,FALSE),
('cat_legs','Legs','Leg-focused strength training.','legs',6.5,0.20,FALSE),
('cat_core','Core','Abs, trunk stability, and core circuits.','core',3.8,0.22,FALSE),
('cat_yoga_hatha','Yoga Hatha','Gentle hatha yoga practice.','yoga-hatha',2.5,0.25,FALSE),
('cat_yoga_vinyasa','Yoga Vinyasa','Flow-based vinyasa yoga practice.','yoga-vinyasa',4.0,0.25,FALSE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  slug = VALUES(slug),
  base_met = VALUES(base_met),
  xp_per_met_min = VALUES(xp_per_met_min),
  is_custom = VALUES(is_custom);

INSERT IGNORE INTO user_gamification (user_id, total_xp, level, next_level_xp)
SELECT id, 0, 1, 500 FROM users;

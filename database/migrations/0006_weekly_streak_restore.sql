-- Migration 0006: Weekly streak and restore fields.
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

CALL add_column_if_missing('user_gamification', 'weekly_streak', 'weekly_streak INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('user_gamification', 'weekly_longest_streak', 'weekly_longest_streak INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('user_gamification', 'streak_freezes', 'streak_freezes TINYINT NOT NULL DEFAULT 2');
CALL add_column_if_missing('user_gamification', 'paid_restores_this_month', 'paid_restores_this_month TINYINT NOT NULL DEFAULT 0');
CALL add_column_if_missing('user_gamification', 'last_freeze_reset', 'last_freeze_reset DATE NULL');
CALL add_column_if_missing('user_gamification', 'last_counted_week_start', 'last_counted_week_start DATE NULL');
CALL add_column_if_missing('user_gamification', 'at_risk_week_start', 'at_risk_week_start DATE NULL');
CALL add_column_if_missing('user_gamification', 'restore_deadline', 'restore_deadline DATETIME NULL');
CALL add_column_if_missing('user_gamification', 'streak_status', 'streak_status ENUM(''active'', ''at_risk'', ''broken'') NOT NULL DEFAULT ''active''');

DROP PROCEDURE IF EXISTS add_column_if_missing;

-- Migration data backfill:
UPDATE user_gamification
SET 
  weekly_streak = IF(COALESCE(weekly_streak, 0) = 0, COALESCE(current_streak, 0), weekly_streak),
  weekly_longest_streak = IF(COALESCE(weekly_longest_streak, 0) = 0, COALESCE(longest_streak, 0), weekly_longest_streak),
  streak_freezes = COALESCE(streak_freezes, 2),
  paid_restores_this_month = COALESCE(paid_restores_this_month, 0),
  streak_status = COALESCE(streak_status, 'active');

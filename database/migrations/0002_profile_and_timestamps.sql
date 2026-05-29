-- Migration 0002: Profile goal fields, account status, timestamps, and indexes.
-- Safe to run once against a database created from 0001_baseline.sql.

USE fitsync_db;

-- New profile + account columns.
ALTER TABLE users
    ADD COLUMN target_weight DECIMAL(5,2) AFTER weight,
    ADD COLUMN preferred_workout_type VARCHAR(50) AFTER target_weight,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER activity_level,
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Constrain role to known values.
ALTER TABLE users
    MODIFY COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

-- Audit timestamps on mutable reference data.
ALTER TABLE exercise_categories
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE workouts
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Ensure long Gemini goal-progress text fits.
ALTER TABLE ai_insights MODIFY goal_progress TEXT NOT NULL;

-- Indexes that back the common ORDER BY / range queries.
CREATE INDEX idx_workouts_user_date ON workouts (user_id, date);
CREATE INDEX idx_weight_user_date ON weight_logs (user_id, date);
CREATE INDEX idx_insights_user_created ON ai_insights (user_id, created_at);
CREATE INDEX idx_exercises_category ON workout_exercises (category_id);

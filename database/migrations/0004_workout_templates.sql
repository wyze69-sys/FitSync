-- Migration: Workout Templates Table
USE fitsync_db;

CREATE TABLE IF NOT EXISTS workout_templates (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id VARCHAR(50) NULL,
  category_name VARCHAR(255) NOT NULL,
  subtype VARCHAR(255) NULL,
  duration_min INT NOT NULL DEFAULT 30,
  exercises JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_by VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_templates_category FOREIGN KEY (category_id) REFERENCES exercise_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_templates_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

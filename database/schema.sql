-- FitSync MySQL Database Schema
-- This file documents the full schema. The backend also creates these tables
-- automatically at startup (see backend/src/utils/bootstrap.js), so running this
-- file manually is optional but useful for a clean, reproducible setup.

CREATE DATABASE IF NOT EXISTS fitsync_db;
USE fitsync_db;

DROP TABLE IF EXISTS xp_logs;
DROP TABLE IF EXISTS levels;
DROP TABLE IF EXISTS user_gamification;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS user_streaks;
DROP TABLE IF EXISTS daily_checkins;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS ai_insights;
DROP TABLE IF EXISTS weight_logs;
DROP TABLE IF EXISTS workout_sets;
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercise_categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(50),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    total_xp INT NOT NULL DEFAULT 0,
    target_weight DECIMAL(5,2),
    preferred_workout_type VARCHAR(50),
    goal VARCHAR(255) DEFAULT 'Maintain fitness',
    activity_level VARCHAR(255) DEFAULT 'Sedentary',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE exercise_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    slug VARCHAR(80) UNIQUE,
    base_met DECIMAL(4,2) NOT NULL DEFAULT 3.50,
    xp_per_met_min DECIMAL(5,3) NOT NULL DEFAULT 0.200,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE workouts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_total INT NOT NULL DEFAULT 0,
    calories_total INT NOT NULL DEFAULT 0,
    calories_burned INT,
    calories INT,
    xp INT NOT NULL DEFAULT 0,
    intensity ENUM('low','med','high') NOT NULL DEFAULT 'med',
    calories_source ENUM('auto','manual') NOT NULL DEFAULT 'auto',
    user_weight_at_log DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workouts_user_date (user_id, date)
);

CREATE TABLE workout_exercises (
    id VARCHAR(50) PRIMARY KEY,
    workout_id VARCHAR(50) NOT NULL,
    category_id VARCHAR(50),
    category_name VARCHAR(255),
    exercise_name VARCHAR(255) NOT NULL,
    duration INT NOT NULL DEFAULT 0,
    calories_burned INT NOT NULL DEFAULT 0,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES exercise_categories(id) ON DELETE SET NULL,
    INDEX idx_exercises_workout (workout_id),
    INDEX idx_exercises_category (category_id)
);

CREATE TABLE workout_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id VARCHAR(50) NOT NULL,
    reps INT NOT NULL DEFAULT 0,
    weight DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE,
    INDEX idx_sets_exercise (exercise_id)
);

CREATE TABLE weight_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    bmi DECIMAL(4,1) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_weight_user_date (user_id, date)
);

CREATE TABLE ai_insights (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date_generated DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    workout_count INT NOT NULL DEFAULT 0,
    total_calories INT NOT NULL DEFAULT 0,
    total_minutes INT NOT NULL DEFAULT 0,
    bmi_value DECIMAL(4,1) NOT NULL,
    current_weight DECIMAL(5,2) NOT NULL,
    summary TEXT NOT NULL,
    recommendations JSON NOT NULL,
    goal_progress TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_insights_user_created (user_id, created_at)
);

-- Gamification: manual wellness check-ins (one per user per day).
CREATE TABLE daily_checkins (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Wellness check-in',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_checkin_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Gamification: achievement (badge) catalog.
CREATE TABLE achievements (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NOT NULL,
    requirement_type VARCHAR(30) NOT NULL DEFAULT 'streak',
    requirement_value INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0
);

-- Gamification: achievements unlocked per user.
CREATE TABLE user_achievements (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    achievement_code VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_achievement (user_id, achievement_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_code) REFERENCES achievements(code) ON DELETE CASCADE
);

-- Gamification: automatic XP, levels, and streak state for v2.
CREATE TABLE user_gamification (
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

CREATE TABLE levels (
    id VARCHAR(50) PRIMARY KEY,
    level_number INT NOT NULL UNIQUE,
    xp_required INT NOT NULL,
    badge_unlock VARCHAR(50),
    title VARCHAR(255) NOT NULL
);

CREATE TABLE xp_logs (
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

-- Gamification: cached streak state per user (recomputed on activity).
CREATE TABLE user_streaks (
    user_id VARCHAR(50) PRIMARY KEY,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

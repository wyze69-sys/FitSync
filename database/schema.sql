-- FitSync MySQL Database Schema

CREATE DATABASE IF NOT EXISTS fitsync_db;
USE fitsync_db;

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
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(50),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    goal VARCHAR(255) DEFAULT 'Maintain fitness',
    activity_level VARCHAR(255) DEFAULT 'Sedentary',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercise_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE workouts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_total INT NOT NULL DEFAULT 0,
    calories_total INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    FOREIGN KEY (category_id) REFERENCES exercise_categories(id) ON DELETE SET NULL
);

CREATE TABLE workout_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_id VARCHAR(50) NOT NULL,
    reps INT NOT NULL DEFAULT 0,
    weight DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
);

CREATE TABLE weight_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    bmi DECIMAL(4,1) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    goal_progress VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

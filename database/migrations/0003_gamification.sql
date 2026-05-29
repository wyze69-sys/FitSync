-- Migration 0003: Gamification (streaks + achievements).
-- Persists streak data and badges so they survive across devices and are
-- visible to the admin dashboard and the weekly AI insight.

USE fitsync_db;

CREATE TABLE IF NOT EXISTS daily_checkins (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Wellness check-in',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_checkin_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NOT NULL,
    requirement_type VARCHAR(30) NOT NULL DEFAULT 'streak',
    requirement_value INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    achievement_code VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_achievement (user_id, achievement_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_code) REFERENCES achievements(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_streaks (
    user_id VARCHAR(50) PRIMARY KEY,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO achievements (code, name, description, requirement_type, requirement_value, sort_order) VALUES
('streak_3', 'Three Day Start', 'Maintained a 3-day activity streak.', 'streak', 3, 1),
('streak_7', 'One Week Streak', 'Maintained a 7-day activity streak.', 'streak', 7, 2),
('streak_14', 'Two Week Habit', 'Maintained a 14-day activity streak.', 'streak', 14, 3),
('streak_30', 'Thirty Day Streak', 'Maintained a 30-day activity streak.', 'streak', 30, 4)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    requirement_value = VALUES(requirement_value),
    sort_order = VALUES(sort_order);

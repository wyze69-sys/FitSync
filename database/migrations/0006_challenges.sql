-- Migration: Challenges Table
USE fitsync_db;

CREATE TABLE IF NOT EXISTS challenges (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(50) NOT NULL,
  target_value INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reward_xp INT NOT NULL DEFAULT 0,
  badge_code VARCHAR(50) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_challenges_badge FOREIGN KEY (badge_code) REFERENCES achievements(code) ON DELETE SET NULL,
  CONSTRAINT fk_challenges_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Migration: Announcements Table
USE fitsync_db;

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  audience ENUM('all', 'users', 'admins') NOT NULL DEFAULT 'users',
  placement VARCHAR(50) NOT NULL DEFAULT 'dashboard',
  start_at DATETIME NULL,
  end_at DATETIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcements_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

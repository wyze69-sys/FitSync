-- Migration 0008: User Feedback table
-- Creates the user_feedback table for storing user-submitted bug reports,
-- feature requests, and general feedback. Admin can triage via status + admin_note.
-- user_id is nullable to allow anonymous submissions.

CREATE TABLE IF NOT EXISTS user_feedback (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NULL,
  type ENUM('bug', 'feature', 'general') NOT NULL DEFAULT 'general',
  subject VARCHAR(255) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status ENUM('new', 'in_progress', 'resolved', 'archived') NOT NULL DEFAULT 'new',
  admin_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_feedback_status (status),
  INDEX idx_feedback_type (type),
  INDEX idx_feedback_user (user_id),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

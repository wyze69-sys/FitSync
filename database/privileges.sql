CREATE DATABASE IF NOT EXISTS fitsync_db;

-- Application user: least-privilege access (SELECT, INSERT, UPDATE, DELETE only)
-- Replace 'CHANGE_ME_USE_STRONG_PASSWORD' with a strong, unique password.
CREATE USER IF NOT EXISTS 'fitsync_user'@'localhost' IDENTIFIED BY 'CHANGE_ME_USE_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON fitsync_db.* TO 'fitsync_user'@'localhost';
FLUSH PRIVILEGES;

-- Note: For schema migrations or initial setup, use a separate admin account
-- with elevated privileges. Do not use the application user for DDL operations.

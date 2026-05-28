CREATE DATABASE IF NOT EXISTS fitsync_db;

CREATE USER IF NOT EXISTS 'fitsync_user'@'localhost' IDENTIFIED BY 'fitsync_password';
GRANT ALL PRIVILEGES ON fitsync_db.* TO 'fitsync_user'@'localhost';
FLUSH PRIVILEGES;

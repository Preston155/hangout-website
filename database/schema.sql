-- ER:LC CAD / MDT Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS erlc_cad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE erlc_cad;

CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('police','fire','ems','dispatch','civilian','admin') NOT NULL,
  callsign_prefix VARCHAR(20) DEFAULT '',
  color VARCHAR(7) DEFAULT '#2563eb',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ranks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id INT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL,
  level INT NOT NULL DEFAULT 1,
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  discord_id VARCHAR(32) UNIQUE,
  username VARCHAR(64) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  avatar VARCHAR(512),
  role ENUM('admin','dispatch','police','fire','ems','civilian') NOT NULL DEFAULT 'civilian',
  department_id INT UNSIGNED,
  rank_id INT UNSIGNED,
  permissions JSON,
  password_hash VARCHAR(255),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (rank_id) REFERENCES ranks(id) ON DELETE SET NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_discord (discord_id)
);

CREATE TABLE IF NOT EXISTS characters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  dob DATE,
  gender VARCHAR(20),
  address VARCHAR(255),
  phone VARCHAR(30),
  licenses JSON,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_char_name (last_name, first_name)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  plate VARCHAR(12) NOT NULL,
  make VARCHAR(60) NOT NULL,
  model VARCHAR(60) NOT NULL,
  color VARCHAR(40),
  year SMALLINT UNSIGNED,
  stolen TINYINT(1) NOT NULL DEFAULT 0,
  registration_status ENUM('valid','expired','suspended','stolen') DEFAULT 'valid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  UNIQUE KEY uk_plate (plate),
  INDEX idx_vehicle_plate (plate)
);

CREATE TABLE IF NOT EXISTS citations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  vehicle_id INT UNSIGNED,
  officer_id INT UNSIGNED NOT NULL,
  charge VARCHAR(255) NOT NULL,
  fine_amount DECIMAL(10,2) DEFAULT 0,
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warnings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  officer_id INT UNSIGNED NOT NULL,
  reason VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS arrests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  officer_id INT UNSIGNED NOT NULL,
  charges JSON NOT NULL,
  location VARCHAR(255),
  narrative TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warrants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id INT UNSIGNED NOT NULL,
  officer_id INT UNSIGNED NOT NULL,
  charge VARCHAR(255) NOT NULL,
  status ENUM('active','served','expired') NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_warrant_status (status)
);

CREATE TABLE IF NOT EXISTS bolos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  creator_id INT UNSIGNED NOT NULL,
  type ENUM('person','vehicle') NOT NULL,
  subject VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  plate VARCHAR(12),
  status ENUM('active','cleared') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bolo_status (status)
);

CREATE TABLE IF NOT EXISTS calls (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  caller_name VARCHAR(100),
  caller_phone VARCHAR(30),
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('police','fire','medical','traffic','other') NOT NULL DEFAULT 'police',
  priority TINYINT UNSIGNED NOT NULL DEFAULT 3,
  status ENUM('pending','active','closed') NOT NULL DEFAULT 'pending',
  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_call_status (status),
  INDEX idx_call_priority (priority)
);

CREATE TABLE IF NOT EXISTS call_assignments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_id INT UNSIGNED NOT NULL,
  unit_id INT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
  UNIQUE KEY uk_call_unit (call_id, unit_id)
);

CREATE TABLE IF NOT EXISTS units (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  callsign VARCHAR(20) NOT NULL,
  status ENUM('available','busy','enroute','onscene','transport','panic','offduty') NOT NULL DEFAULT 'offduty',
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_unit (user_id),
  INDEX idx_unit_status (status)
);

CREATE TABLE IF NOT EXISTS patient_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_id INT UNSIGNED,
  unit_id INT UNSIGNED NOT NULL,
  patient_name VARCHAR(120) NOT NULL,
  vitals JSON,
  treatment TEXT,
  transport_hospital VARCHAR(120),
  transport_status ENUM('none','enroute','arrived','complete') DEFAULT 'none',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(40),
  entity_id INT UNSIGNED,
  details JSON,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_created (created_at)
);

CREATE TABLE IF NOT EXISTS server_config (
  config_key VARCHAR(64) PRIMARY KEY,
  config_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

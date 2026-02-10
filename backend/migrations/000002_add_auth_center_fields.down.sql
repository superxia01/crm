-- Rollback migration: Restore original users table structure
-- Migration: 000002_add_auth_center_fields.down.sql

-- Note: This is a destructive rollback. In production, you might want to keep the new structure.

-- Drop the new table
DROP TABLE IF EXISTS users;

-- Restore the original table structure
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Restore data from backup if it exists
INSERT INTO users (email, name, password_hash, role, is_active, created_at, updated_at)
SELECT email, name, password_hash, role, is_active, created_at, updated_at
FROM users_backup_000002;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Drop backup table
DROP TABLE IF EXISTS users_backup_000002;

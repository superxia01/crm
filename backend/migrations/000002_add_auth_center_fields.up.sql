-- Add auth-center fields to users table
-- Migration: 000002_add_auth_center_fields.up.sql

-- Step 1: Create a backup of existing users
CREATE TABLE IF NOT EXISTS users_backup_000002 AS SELECT * FROM users;

-- Step 2: Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_center_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS union_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}'::jsonb;

-- Step 3: Create a new temporary table with the correct structure
CREATE TABLE users_new (
  id VARCHAR(255) PRIMARY KEY,
  auth_center_user_id VARCHAR(255) UNIQUE NOT NULL,
  union_id VARCHAR(255),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  name VARCHAR(255),
  nickname VARCHAR(255),
  avatar_url TEXT,
  profile JSONB DEFAULT '{}'::jsonb,
  role VARCHAR(50) DEFAULT 'USER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Step 4: Copy existing data to the new table
-- For existing users, generate a UUID and use email as auth_center_user_id
INSERT INTO users_new (id, auth_center_user_id, email, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid()::text as id,
  gen_random_uuid()::text as auth_center_user_id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
FROM users;

-- Step 5: Drop the old table and rename the new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Step 6: Create indexes
CREATE UNIQUE INDEX idx_users_auth_center_user_id ON users(auth_center_user_id);
CREATE INDEX idx_users_union_id ON users(union_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Step 7: Add comments
COMMENT ON COLUMN users.id IS 'Primary key (UUID)';
COMMENT ON COLUMN users.auth_center_user_id IS 'User ID from auth-center';
COMMENT ON COLUMN users.union_id IS 'WeChat UnionID';
COMMENT ON COLUMN users.email IS 'Email address';
COMMENT ON COLUMN users.phone_number IS 'Phone number';
COMMENT ON COLUMN users.nickname IS 'Display nickname';
COMMENT ON COLUMN users.avatar_url IS 'Avatar URL';
COMMENT ON COLUMN users.profile IS 'Additional profile data (JSONB)';

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
DROP TRIGGER IF EXISTS update_interactions_updated_at ON interactions;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS interactions;
DROP TABLE IF EXISTS knowledge_base;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

-- Drop pgvector extension
DROP EXTENSION IF EXISTS vector;

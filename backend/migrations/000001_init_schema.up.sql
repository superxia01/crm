-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create index on users.email
CREATE INDEX idx_users_email ON users(email);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Basic Information
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    industry VARCHAR(100),

    -- Sales Information
    budget VARCHAR(50) DEFAULT 'Not Specified',
    intent_level VARCHAR(20) DEFAULT 'Medium',
    stage VARCHAR(50) DEFAULT 'Leads',
    source VARCHAR(50) DEFAULT 'Manual',
    follow_up_count INTEGER DEFAULT 0,

    -- Contract Information
    contract_value VARCHAR(50),
    contract_status VARCHAR(20) DEFAULT 'Pending',
    contract_start_date DATE,
    contract_end_date DATE,
    expected_close_date DATE,
    probability INTEGER DEFAULT 0,
    annual_revenue VARCHAR(50),

    notes TEXT,
    last_contact DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for customers
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_stage ON customers(stage);
CREATE INDEX idx_customers_intent_level ON customers(intent_level);
CREATE INDEX idx_customers_source ON customers(source);
CREATE INDEX idx_customers_industry ON customers(industry);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);

-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    tags TEXT[],
    description TEXT,

    -- Vector embedding for semantic search
    embedding vector(1536),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for knowledge_base
CREATE INDEX idx_knowledge_user_id ON knowledge_base(user_id);
CREATE INDEX idx_knowledge_type ON knowledge_base(type);
CREATE INDEX idx_knowledge_tags ON knowledge_base USING GIN(tags);
CREATE INDEX idx_knowledge_deleted_at ON knowledge_base(deleted_at);

-- Create vector similarity index using HNSW algorithm
CREATE INDEX idx_knowledge_embedding ON knowledge_base
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,
    content TEXT,
    outcome VARCHAR(50),
    next_action VARCHAR(255),
    next_date TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for interactions
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_customer_id ON interactions(customer_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_deleted_at ON interactions(deleted_at);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (password: admin123)
-- Password hash is generated using bcrypt with cost 10
INSERT INTO users (email, name, password_hash, role, is_active)
VALUES ('admin@nextcrm.com', 'Admin User', '$2a$10$YourHashedPasswordHere', 'ADMIN', true)
ON CONFLICT (email) DO NOTHING;

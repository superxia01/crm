-- Create activities table for tracking user and AI actions
CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,

    -- Activity details
    action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'analyzed', 'generated', etc.
    entity_type VARCHAR(50), -- 'customer', 'contract', 'script', 'analysis', etc.
    entity_id BIGINT,

    description TEXT NOT NULL,
    metadata JSONB, -- Additional context like AI suggestions, old/new values, etc.

    -- For AI-generated activities
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence DECIMAL(3,2), -- 0.00 to 1.00

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_action_type ON activities(action_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON activities(deleted_at);

-- Create revenue_history table for tracking monthly revenue
CREATE TABLE IF NOT EXISTS revenue_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    month VARCHAR(7) NOT NULL, -- Format: '2025-01'
    year INT NOT NULL,
    month_number INT NOT NULL, -- 1-12

    revenue DECIMAL(15,2) DEFAULT 0,
    target DECIMAL(15,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, month)
);

-- Create indexes for revenue_history
CREATE INDEX IF NOT EXISTS idx_revenue_user_id ON revenue_history(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_month ON revenue_history(month DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_year_month ON revenue_history(year, month_number);

-- Create update trigger for revenue_history
CREATE OR REPLACE FUNCTION update_revenue_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_revenue_history_updated_at ON revenue_history;
CREATE TRIGGER update_revenue_history_updated_at
BEFORE UPDATE ON revenue_history
FOR EACH ROW
EXECUTE FUNCTION update_revenue_history_updated_at();

-- Comment tables
COMMENT ON TABLE activities IS 'Activity log for user actions and AI-generated events';
COMMENT ON TABLE revenue_history IS 'Monthly revenue tracking with targets';

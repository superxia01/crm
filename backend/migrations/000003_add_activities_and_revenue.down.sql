-- Drop triggers
DROP TRIGGER IF EXISTS update_revenue_history_updated_at ON revenue_history;
DROP FUNCTION IF EXISTS update_revenue_history_updated_at;

-- Drop tables
DROP TABLE IF EXISTS revenue_history;
DROP TABLE IF EXISTS activities;

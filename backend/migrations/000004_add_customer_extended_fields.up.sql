-- Add extended customer fields (all optional, backward compatible)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_no VARCHAR(64);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(32);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(128);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_scale VARCHAR(64);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS registered_capital VARCHAR(64);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS legal_person VARCHAR(128);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_code VARCHAR(64);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_level VARCHAR(32);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_status VARCHAR(32);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS potential_score INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS invoice_title VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_number VARCHAR(64);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bank_account VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_customers_customer_no ON customers(customer_no);
CREATE INDEX IF NOT EXISTS idx_customers_customer_level ON customers(customer_level);

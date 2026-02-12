DROP INDEX IF EXISTS idx_customers_customer_level;
DROP INDEX IF EXISTS idx_customers_customer_no;

ALTER TABLE customers DROP COLUMN IF EXISTS payment_terms;
ALTER TABLE customers DROP COLUMN IF EXISTS bank_account;
ALTER TABLE customers DROP COLUMN IF EXISTS tax_number;
ALTER TABLE customers DROP COLUMN IF EXISTS invoice_title;
ALTER TABLE customers DROP COLUMN IF EXISTS potential_score;
ALTER TABLE customers DROP COLUMN IF EXISTS customer_status;
ALTER TABLE customers DROP COLUMN IF EXISTS customer_level;
ALTER TABLE customers DROP COLUMN IF EXISTS credit_code;
ALTER TABLE customers DROP COLUMN IF EXISTS legal_person;
ALTER TABLE customers DROP COLUMN IF EXISTS registered_capital;
ALTER TABLE customers DROP COLUMN IF EXISTS company_scale;
ALTER TABLE customers DROP COLUMN IF EXISTS address;
ALTER TABLE customers DROP COLUMN IF EXISTS wechat_id;
ALTER TABLE customers DROP COLUMN IF EXISTS customer_type;
ALTER TABLE customers DROP COLUMN IF EXISTS customer_no;

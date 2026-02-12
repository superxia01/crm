-- Deals (业绩) table
CREATE TABLE IF NOT EXISTS deals (
  id BIGSERIAL PRIMARY KEY,
  record_no VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  deal_type VARCHAR(32) NOT NULL DEFAULT 'sale',
  product_or_service VARCHAR(255) NOT NULL DEFAULT '',
  quantity DECIMAL(18,4) NOT NULL DEFAULT 1,
  unit VARCHAR(32) NOT NULL DEFAULT 'piece',
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  contract_no VARCHAR(128) DEFAULT '',
  signed_at TIMESTAMPTZ,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  is_repeat_purchase BOOLEAN NOT NULL DEFAULT false,
  deal_at TIMESTAMPTZ NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_customer_id ON deals(customer_id);
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_deal_at ON deals(deal_at);
CREATE INDEX idx_deals_deleted_at ON deals(deleted_at);
CREATE UNIQUE INDEX idx_deals_record_no ON deals(record_no);

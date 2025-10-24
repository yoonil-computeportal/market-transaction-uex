-- ============================================================================
-- Migration: Add UEX Integration Fields to payment_transactions
-- ============================================================================
-- This migration adds fields required for UEX cryptocurrency payment processing
--
-- Usage:
--   SQLite: sqlite3 dev.db < migrations/003_add_uex_fields.sql
--   PostgreSQL: psql -d uex_payments -f migrations/003_add_uex_fields.sql
--
-- Rollback: See rollback section at the bottom
-- ============================================================================

-- Add UEX order tracking fields
ALTER TABLE payment_transactions ADD COLUMN uex_order_id VARCHAR(255);
ALTER TABLE payment_transactions ADD COLUMN uex_deposit_address TEXT;
ALTER TABLE payment_transactions ADD COLUMN deposit_tag VARCHAR(100);
ALTER TABLE payment_transactions ADD COLUMN qr_code_url TEXT;
ALTER TABLE payment_transactions ADD COLUMN uex_status VARCHAR(100);
ALTER TABLE payment_transactions ADD COLUMN uex_raw_response TEXT; -- JSON as TEXT for SQLite compatibility
ALTER TABLE payment_transactions ADD COLUMN uex_webhook_data TEXT; -- JSON as TEXT for SQLite compatibility
ALTER TABLE payment_transactions ADD COLUMN last_webhook_at TIMESTAMP;
ALTER TABLE payment_transactions ADD COLUMN last_poll_at TIMESTAMP;

-- Add indexes for better query performance
CREATE INDEX idx_payment_transactions_uex_order_id ON payment_transactions(uex_order_id);
CREATE INDEX idx_payment_transactions_uex_status ON payment_transactions(uex_status);
CREATE INDEX idx_payment_transactions_last_webhook ON payment_transactions(last_webhook_at);
CREATE INDEX idx_payment_transactions_last_poll ON payment_transactions(last_poll_at);

-- Add index for finding pending UEX transactions (for polling)
CREATE INDEX idx_payment_transactions_pending_uex
ON payment_transactions(status, uex_order_id)
WHERE uex_order_id IS NOT NULL;

-- ============================================================================
-- Create UEX Order Tracking Table
-- ============================================================================
-- Separate table for detailed UEX order tracking and history

CREATE TABLE uex_order_tracking (
  id VARCHAR(36) PRIMARY KEY,
  transaction_id VARCHAR(36) NOT NULL,
  uex_order_id VARCHAR(255) NOT NULL,

  -- Order details
  from_currency VARCHAR(10) NOT NULL,
  from_network VARCHAR(50) NOT NULL,
  from_amount DECIMAL(20, 8) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  to_network VARCHAR(50) NOT NULL,
  to_amount DECIMAL(20, 8) NOT NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,

  -- Deposit information
  deposit_address TEXT NOT NULL,
  deposit_tag VARCHAR(100),
  qr_code_url TEXT,

  -- Status tracking
  status VARCHAR(100) NOT NULL DEFAULT 'Awaiting Deposit',
  external_status VARCHAR(100), -- UEX's raw status
  deposit_confirmed BOOLEAN DEFAULT FALSE,

  -- Transaction hashes
  deposit_tx_hash VARCHAR(255),
  payout_tx_hash VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,

  -- Metadata
  raw_response TEXT, -- Full UEX response as JSON
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Foreign key
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

-- Indexes for uex_order_tracking
CREATE INDEX idx_uex_tracking_transaction_id ON uex_order_tracking(transaction_id);
CREATE INDEX idx_uex_tracking_uex_order_id ON uex_order_tracking(uex_order_id);
CREATE INDEX idx_uex_tracking_status ON uex_order_tracking(status);
CREATE INDEX idx_uex_tracking_created_at ON uex_order_tracking(created_at);

-- ============================================================================
-- Create Referral Earnings Table
-- ============================================================================
-- Track referral commissions earned from UEX

CREATE TABLE referral_earnings (
  id VARCHAR(36) PRIMARY KEY,
  transaction_id VARCHAR(36) NOT NULL,
  uex_order_id VARCHAR(255) NOT NULL,

  -- Earnings details
  commission_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0.0019, -- 0.19%
  commission_amount DECIMAL(20, 8) NOT NULL,
  commission_currency VARCHAR(10) NOT NULL,

  -- Cardano bonus (if applicable)
  ada_bonus DECIMAL(20, 8),

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, paid
  paid_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  notes TEXT,

  -- Foreign key
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

-- Indexes for referral_earnings
CREATE INDEX idx_referral_earnings_transaction_id ON referral_earnings(transaction_id);
CREATE INDEX idx_referral_earnings_uex_order_id ON referral_earnings(uex_order_id);
CREATE INDEX idx_referral_earnings_status ON referral_earnings(status);
CREATE INDEX idx_referral_earnings_created_at ON referral_earnings(created_at);

-- ============================================================================
-- Create Webhook Events Log Table
-- ============================================================================
-- Log all webhook events for debugging and analytics

CREATE TABLE webhook_events (
  id VARCHAR(36) PRIMARY KEY,

  -- Event details
  event_type VARCHAR(100) NOT NULL, -- order_update, payment_complete, etc.
  source VARCHAR(50) NOT NULL DEFAULT 'uex', -- uex, internal, etc.

  -- Order reference
  uex_order_id VARCHAR(255),
  transaction_id VARCHAR(36),

  -- Webhook data
  payload TEXT NOT NULL, -- Full webhook payload as JSON
  signature VARCHAR(255), -- Webhook signature for validation
  signature_valid BOOLEAN,

  -- Processing
  status VARCHAR(50) NOT NULL DEFAULT 'received', -- received, processed, failed
  processed_at TIMESTAMP,
  error_message TEXT,

  -- Timestamps
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Indexes for webhook_events
CREATE INDEX idx_webhook_events_uex_order_id ON webhook_events(uex_order_id);
CREATE INDEX idx_webhook_events_transaction_id ON webhook_events(transaction_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);

-- ============================================================================
-- Add Comments (PostgreSQL only - comment out for SQLite)
-- ============================================================================

-- COMMENT ON COLUMN payment_transactions.uex_order_id IS 'UEX swap order ID';
-- COMMENT ON COLUMN payment_transactions.uex_deposit_address IS 'Crypto deposit address for customer';
-- COMMENT ON COLUMN payment_transactions.deposit_tag IS 'Memo/tag for deposit (XRP, XLM, etc.)';
-- COMMENT ON COLUMN payment_transactions.qr_code_url IS 'QR code image URL for deposit address';
-- COMMENT ON COLUMN payment_transactions.uex_status IS 'Current status from UEX API';
-- COMMENT ON TABLE uex_order_tracking IS 'Detailed tracking for UEX swap orders';
-- COMMENT ON TABLE referral_earnings IS 'Referral commission tracking from UEX';
-- COMMENT ON TABLE webhook_events IS 'Webhook event log for debugging';

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration:
--
-- DROP TABLE IF EXISTS webhook_events;
-- DROP TABLE IF EXISTS referral_earnings;
-- DROP TABLE IF EXISTS uex_order_tracking;
-- DROP INDEX IF EXISTS idx_payment_transactions_pending_uex;
-- DROP INDEX IF EXISTS idx_payment_transactions_last_poll;
-- DROP INDEX IF EXISTS idx_payment_transactions_last_webhook;
-- DROP INDEX IF EXISTS idx_payment_transactions_uex_status;
-- DROP INDEX IF EXISTS idx_payment_transactions_uex_order_id;
--
-- ALTER TABLE payment_transactions DROP COLUMN last_poll_at;
-- ALTER TABLE payment_transactions DROP COLUMN last_webhook_at;
-- ALTER TABLE payment_transactions DROP COLUMN uex_webhook_data;
-- ALTER TABLE payment_transactions DROP COLUMN uex_raw_response;
-- ALTER TABLE payment_transactions DROP COLUMN uex_status;
-- ALTER TABLE payment_transactions DROP COLUMN qr_code_url;
-- ALTER TABLE payment_transactions DROP COLUMN deposit_tag;
-- ALTER TABLE payment_transactions DROP COLUMN uex_deposit_address;
-- ALTER TABLE payment_transactions DROP COLUMN uex_order_id;
-- ============================================================================

-- Migration complete
SELECT 'Migration 003 completed successfully' AS status;

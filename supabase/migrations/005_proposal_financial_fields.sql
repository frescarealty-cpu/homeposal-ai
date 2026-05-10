-- Add financial detail fields to proposals and place_proposals
-- All new fields nullable for backward compatibility

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS purchase_price_cents BIGINT,
  ADD COLUMN IF NOT EXISTS initial_deposit_cents BIGINT,
  ADD COLUMN IF NOT EXISTS loan_amount_cents BIGINT,
  ADD COLUMN IF NOT EXISTS loan_type TEXT CHECK (loan_type IS NULL OR loan_type IN ('fixed', 'adjustable')),
  ADD COLUMN IF NOT EXISTS down_payment_cents BIGINT;

ALTER TABLE place_proposals
  ADD COLUMN IF NOT EXISTS purchase_price_cents BIGINT,
  ADD COLUMN IF NOT EXISTS initial_deposit_cents BIGINT,
  ADD COLUMN IF NOT EXISTS loan_amount_cents BIGINT,
  ADD COLUMN IF NOT EXISTS loan_type TEXT CHECK (loan_type IS NULL OR loan_type IN ('fixed', 'adjustable')),
  ADD COLUMN IF NOT EXISTS down_payment_cents BIGINT;

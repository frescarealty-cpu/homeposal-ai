-- Concierge proposal capture
-- Adds fields required for AI Concierge intake and a "verified" status gate.

-- 1) Extend allowed proposal statuses
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('pending', 'verified', 'approved', 'accepted', 'rejected', 'expired', 'withdrawn'));

ALTER TABLE place_proposals DROP CONSTRAINT IF EXISTS place_proposals_status_check;
ALTER TABLE place_proposals ADD CONSTRAINT place_proposals_status_check
  CHECK (status IN ('pending', 'verified', 'approved', 'accepted', 'rejected', 'expired', 'withdrawn'));

-- 2) Concierge-specific structured fields (kept nullable for backwards compatibility)
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS proposer_legal_name TEXT,
  ADD COLUMN IF NOT EXISTS contingencies TEXT,
  ADD COLUMN IF NOT EXISTS proof_of_funds_file_path TEXT,
  ADD COLUMN IF NOT EXISTS concierge_payload JSONB;

ALTER TABLE place_proposals
  ADD COLUMN IF NOT EXISTS proposer_legal_name TEXT,
  ADD COLUMN IF NOT EXISTS contingencies TEXT,
  ADD COLUMN IF NOT EXISTS proof_of_funds_file_path TEXT,
  ADD COLUMN IF NOT EXISTS concierge_payload JSONB;


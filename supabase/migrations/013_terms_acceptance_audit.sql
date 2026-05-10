-- Audit fields for compliance confirmation modal acceptance
-- Stores whether the user accepted Terms/Notice at Collection at submission time

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

ALTER TABLE place_proposals
  ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;


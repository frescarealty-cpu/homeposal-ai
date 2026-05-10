-- Proof of funds and prequal/pre-approval letter (yes/no)
-- Run this in Supabase Dashboard → SQL Editor if you haven't applied migrations via CLI.

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS proof_of_funds BOOLEAN,
  ADD COLUMN IF NOT EXISTS prequal_letter BOOLEAN;

ALTER TABLE place_proposals
  ADD COLUMN IF NOT EXISTS proof_of_funds BOOLEAN,
  ADD COLUMN IF NOT EXISTS prequal_letter BOOLEAN;

-- Preferred method of contact for verification (Phone / Text / Email)
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('phone', 'text', 'email'));

ALTER TABLE place_proposals
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('phone', 'text', 'email'));

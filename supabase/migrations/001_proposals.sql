-- Proposals table: public fields (price, financing, closing_date, offer_date) + private fields (user_id, status, full_notes)
-- Prerequisite: Run the properties table schema from plan.md first (or ensure it exists).
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Public fields (visible without login)
  offer_amount_cents BIGINT NOT NULL,
  financing_type TEXT NOT NULL DEFAULT 'conventional' CHECK (financing_type IN ('cash', 'conventional', 'fha', 'va', 'other')),
  closing_date DATE NOT NULL,

  -- Private fields (never exposed in public view)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')),
  full_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_property ON proposals(property_id);
CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created ON proposals(created_at DESC);

-- RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Anyone can read from proposals_public (via view); for direct table access:
-- Anonymous/public: no direct SELECT on proposals (use proposals_public view or API)
-- Authenticated: can SELECT own proposals only
CREATE POLICY "proposals_select_own" ON proposals
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert their own proposals
CREATE POLICY "proposals_insert_auth" ON proposals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Authenticated users can update/withdraw their own pending proposals
CREATE POLICY "proposals_update_own" ON proposals
  FOR UPDATE USING (auth.uid() = user_id);

-- Function for public API: returns only public columns, bypasses RLS
CREATE OR REPLACE FUNCTION get_proposals_public(p_property_id UUID)
RETURNS TABLE (
  id UUID,
  offer_date TIMESTAMPTZ,
  price_cents BIGINT,
  financing_type TEXT,
  closing_date DATE
) LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, created_at, offer_amount_cents, financing_type, closing_date
  FROM proposals
  WHERE property_id = p_property_id AND status = 'pending'
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_proposals_public(UUID) TO anon;

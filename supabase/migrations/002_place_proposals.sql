-- Proposals for address-only places (no property in our catalog)
-- Similar shape to proposals but keyed by address + coordinates instead of property_id

CREATE TABLE IF NOT EXISTS place_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_address TEXT NOT NULL,
  place_lat DOUBLE PRECISION NOT NULL,
  place_lng DOUBLE PRECISION NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Public fields (visible without login)
  offer_amount_cents BIGINT NOT NULL,
  financing_type TEXT NOT NULL DEFAULT 'conventional' CHECK (financing_type IN ('cash', 'conventional', 'fha', 'va', 'other')),
  closing_date DATE NOT NULL,

  -- Private fields
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')),
  full_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_place_proposals_location ON place_proposals(place_address, place_lat, place_lng);
CREATE INDEX idx_place_proposals_user ON place_proposals(user_id);
CREATE INDEX idx_place_proposals_status ON place_proposals(status);
CREATE INDEX idx_place_proposals_created ON place_proposals(created_at DESC);

ALTER TABLE place_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "place_proposals_select_own" ON place_proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "place_proposals_insert_auth" ON place_proposals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "place_proposals_update_own" ON place_proposals
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read: allow anyone to see pending place proposals for a given location
CREATE POLICY "place_proposals_select_public" ON place_proposals
  FOR SELECT USING (status = 'pending');

CREATE OR REPLACE FUNCTION get_place_proposals_public(
  p_address TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  offer_date TIMESTAMPTZ,
  price_cents BIGINT,
  financing_type TEXT,
  closing_date DATE
) LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, created_at, offer_amount_cents, financing_type, closing_date
  FROM place_proposals
  WHERE place_address = p_address
    AND ABS(place_lat - p_lat) < 0.0001
    AND ABS(place_lng - p_lng) < 0.0001
    AND status = 'pending'
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_place_proposals_public(TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;
GRANT EXECUTE ON FUNCTION get_place_proposals_public(TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

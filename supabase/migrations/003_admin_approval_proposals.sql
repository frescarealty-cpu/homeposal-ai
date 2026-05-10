-- Admin approval: proposals stay "pending" until admin approves → "approved"
-- Only "approved" proposals appear on the public property page.

-- 1. Add "approved" status to proposals
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('pending', 'approved', 'accepted', 'rejected', 'expired', 'withdrawn'));

-- 2. Public view shows only admin-approved proposals
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
  WHERE property_id = p_property_id AND status = 'approved'
  ORDER BY created_at DESC;
$$;

-- 3. Add "approved" status to place_proposals
ALTER TABLE place_proposals DROP CONSTRAINT IF EXISTS place_proposals_status_check;
ALTER TABLE place_proposals ADD CONSTRAINT place_proposals_status_check
  CHECK (status IN ('pending', 'approved', 'accepted', 'rejected', 'expired', 'withdrawn'));

-- 4. Public view shows only admin-approved place proposals
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
    AND status = 'approved'
  ORDER BY created_at DESC;
$$;

-- 5. Update place_proposals public policy (used if queried directly; RPC uses SECURITY DEFINER)
DROP POLICY IF EXISTS "place_proposals_select_public" ON place_proposals;
CREATE POLICY "place_proposals_select_public" ON place_proposals
  FOR SELECT USING (status = 'approved');

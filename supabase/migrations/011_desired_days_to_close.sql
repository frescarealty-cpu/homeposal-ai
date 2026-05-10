-- Store the user-entered "desired days to close" so it displays as static (no countdown).
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS desired_days_to_close INT;

ALTER TABLE place_proposals
  ADD COLUMN IF NOT EXISTS desired_days_to_close INT;

-- Drop existing functions so we can change their return type (add desired_days_to_close).
DROP FUNCTION IF EXISTS get_proposals_public(UUID);
DROP FUNCTION IF EXISTS get_place_proposals_public(TEXT, DOUBLE PRECISION, DOUBLE PRECISION);

-- Public RPCs: return stored value for display
CREATE FUNCTION get_proposals_public(p_property_id UUID)
RETURNS TABLE (
  id UUID,
  offer_date TIMESTAMPTZ,
  price_cents BIGINT,
  financing_type TEXT,
  closing_date DATE,
  desired_days_to_close INT
) LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, created_at, offer_amount_cents, financing_type, closing_date, desired_days_to_close
  FROM proposals
  WHERE property_id = p_property_id AND status = 'approved'
  ORDER BY created_at DESC;
$$;

CREATE FUNCTION get_place_proposals_public(
  p_address TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  offer_date TIMESTAMPTZ,
  price_cents BIGINT,
  financing_type TEXT,
  closing_date DATE,
  desired_days_to_close INT
) LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, created_at, offer_amount_cents, financing_type, closing_date, desired_days_to_close
  FROM place_proposals
  WHERE place_address = p_address
    AND ABS(place_lat - p_lat) < 0.0001
    AND ABS(place_lng - p_lng) < 0.0001
    AND status = 'approved'
  ORDER BY created_at DESC;
$$;

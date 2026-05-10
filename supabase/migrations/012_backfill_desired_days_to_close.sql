-- Backfill desired_days_to_close for existing rows so "My proposals" shows a static value (no countdown).
-- Uses calendar days from offer date (created_at) to closing_date.

UPDATE proposals
SET desired_days_to_close = GREATEST(0, closing_date - (created_at AT TIME ZONE 'UTC')::date)
WHERE desired_days_to_close IS NULL;

UPDATE place_proposals
SET desired_days_to_close = GREATEST(0, closing_date - (created_at AT TIME ZONE 'UTC')::date)
WHERE desired_days_to_close IS NULL;

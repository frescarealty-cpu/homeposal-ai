-- Backfill profiles.email from auth.users so admin and other readers see emails.
-- Safe to run multiple times (only updates where profiles.email IS NULL).

UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
  AND p.email IS NULL
  AND au.email IS NOT NULL;

-- Ensure new signups get email set from auth at profile creation (requires 007_profiles_email).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_verified, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'individual_buyer'),
    false,
    NEW.email
  );
  RETURN NEW;
END;
$$;

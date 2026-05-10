-- Auto-create a profile row when a new user signs up (auth.users insert).
-- Uses only columns from the base profiles table (no email). The app then
-- updates the row with verification_token, phone, email (if column exists), etc.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'individual_buyer'),
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles table: extends auth.users with full_name, phone, role, is_verified
-- Users must verify email before they can submit proposals

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'individual_buyer' CHECK (role IN ('individual_buyer', 'agent', 'investor')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX idx_profiles_verification_token ON profiles(verification_token) WHERE verification_token IS NOT NULL;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (e.g. after verification)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Authenticated users can insert their own profile (during signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


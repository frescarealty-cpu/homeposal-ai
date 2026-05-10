-- Store email on profiles for admin display (synced at signup; auth.users remains source of truth for login)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email opt-in and first-login tracking to profiles.
-- email_opt_in: user agreed to receive emails from Campus Guide (admin page shows these users).
-- last_login_at: null on signup; set on first login so Dashboard can show "Welcome" vs "Welcome back".

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

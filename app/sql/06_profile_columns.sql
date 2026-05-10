-- 06_profile_columns.sql
-- Run this in your Supabase SQL Editor to ensure all settings columns exist

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS major text, 
  ADD COLUMN IF NOT EXISTS graduation_year integer,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS merit text,
  ADD COLUMN IF NOT EXISTS additional_data text,
  ADD COLUMN IF NOT EXISTS signup_date date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"emailNotifications": true, "theme": "light"}'::jsonb,
  ADD COLUMN IF NOT EXISTS welcome_email_sent boolean DEFAULT false;

-- Notify PostgREST to reload the schema cache so the API immediately recognizes the new columns
NOTIFY pgrst, 'reload schema';

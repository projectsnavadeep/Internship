-- ============================================
-- InternTrack - Signup Database Fix
-- ============================================
-- This script fixes the "Database error saving new user" issue.
-- It ensures all required profile columns exist and that the 
-- signup trigger is compatible with the latest schema.
-- ============================================

-- 1. ADD MISSING COLUMNS TO PROFILES (if they don't exist)
-- We use safe defaults (null) to ensure the trigger doesn't fail.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merit text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS additional_data text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_date date DEFAULT current_date;

-- 2. UPDATE THE SIGNUP TRIGGER FUNCTION
-- This function runs every time a new user registers.
-- It now explicitly handles the signup_date if needed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    signup_date
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    'student',
    current_date
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    signup_date = COALESCE(public.profiles.signup_date, EXCLUDED.signup_date);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE TRIGGER IS ATTACHED
-- Re-attaching the trigger to auth.users to be certain.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- SCRIPT COMPLETE ✅
-- Run this in your Supabase SQL Editor.
-- ==========================================

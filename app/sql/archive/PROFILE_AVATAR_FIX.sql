-- ============================================================================
-- InternTrack - PROFILE & SYSTEM TABLES FIX
-- ============================================================================
-- WHAT THIS FIXES:
--   1. Adds missing columns to profiles (dob, merit, additional_data, signup_date)
--   2. Creates the error_logs table (was referenced in code but never created)
--   3. Creates the admin_actions table (was referenced in code but never created)
--   4. Applies proper RLS and indexes for all new structures
-- ============================================================================
-- SAFE TO RE-RUN (fully idempotent)
-- ============================================================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO PROFILES
-- ============================================
-- These columns are used by SettingsView.tsx and adminGetAllUsers()
-- but were never added to the database schema.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merit text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS additional_data text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_date date DEFAULT current_date;

-- Backfill signup_date for existing users from created_at
UPDATE public.profiles
SET signup_date = created_at::date
WHERE signup_date IS NULL AND created_at IS NOT NULL;


-- ============================================
-- 2. ERROR LOGS TABLE
-- ============================================
-- Referenced by supabase.ts logError() and adminGetErrorLogs()
-- but was never defined in any SQL file.

CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  user_email text,
  user_name text,
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_details text,
  action_attempted text,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert error logs (for self-reporting)
DROP POLICY IF EXISTS "error_logs_insert" ON public.error_logs;
CREATE POLICY "error_logs_insert" ON public.error_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own error logs
DROP POLICY IF EXISTS "error_logs_select_own" ON public.error_logs;
CREATE POLICY "error_logs_select_own" ON public.error_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all error logs
DROP POLICY IF EXISTS "error_logs_select_admin" ON public.error_logs;
CREATE POLICY "error_logs_select_admin" ON public.error_logs FOR SELECT
  USING (public.is_admin());

-- Admins can update error logs (resolve them)
DROP POLICY IF EXISTS "error_logs_update_admin" ON public.error_logs;
CREATE POLICY "error_logs_update_admin" ON public.error_logs FOR UPDATE
  USING (public.is_admin());

-- Admins can delete error logs
DROP POLICY IF EXISTS "error_logs_delete_admin" ON public.error_logs;
CREATE POLICY "error_logs_delete_admin" ON public.error_logs FOR DELETE
  USING (public.is_admin());

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);


-- ============================================
-- 3. ADMIN ACTIONS TABLE
-- ============================================
-- Referenced by supabase.ts adminResolveError() for audit logging
-- but was never defined in any SQL file.

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can insert
DROP POLICY IF EXISTS "admin_actions_insert" ON public.admin_actions;
CREATE POLICY "admin_actions_insert" ON public.admin_actions FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can read
DROP POLICY IF EXISTS "admin_actions_select" ON public.admin_actions;
CREATE POLICY "admin_actions_select" ON public.admin_actions FOR SELECT
  USING (public.is_admin());

-- Index
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON public.admin_actions(action_type);


-- ============================================
-- 4. REFRESH ADMIN VIEWS (include new columns)
-- ============================================
-- Update the admin_user_activity view to include the new profile columns

CREATE OR REPLACE VIEW public.admin_user_activity AS
SELECT
  p.id as user_id,
  p.full_name,
  u.email,
  p.university,
  p.major,
  p.role,
  p.login_count,
  p.last_login_at,
  p.welcome_email_sent,
  p.avatar_url,
  p.dob,
  p.merit,
  p.additional_data,
  p.signup_date,
  p.graduation_year,
  p.created_at as joined_at,
  count(a.id)::int as application_count
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN public.applications a ON a.user_id = p.id
GROUP BY p.id, p.full_name, u.email, p.university, p.major, p.role,
         p.login_count, p.last_login_at, p.welcome_email_sent, p.avatar_url,
         p.dob, p.merit, p.additional_data, p.signup_date, p.graduation_year,
         p.created_at
ORDER BY p.last_login_at DESC NULLS LAST;


-- ============================================================================
-- SCRIPT COMPLETE ✅
-- Run this in your Supabase SQL Editor
-- ============================================================================

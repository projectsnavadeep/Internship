-- ============================================
-- InternTrack - Database Migration Script (Safe to re-run)
-- ============================================
-- Run this in your Supabase SQL Editor if the tables ALREADY EXIST.
-- This adds the new columns and policies without dropping anything.

-- ============================================
-- 1. ADD NEW COLUMNS TO PROFILES
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';

-- Add check constraint for role (only if it doesn't exist)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. ADD ADMIN RLS POLICIES
-- ============================================
-- These allow admin users to read ALL data across all tables

DROP POLICY IF EXISTS "admin_profile_select" ON public.profiles;
CREATE POLICY "admin_profile_select" ON public.profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "admin_applications_select" ON public.applications;
CREATE POLICY "admin_applications_select" ON public.applications FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "admin_notes_select" ON public.interview_notes;
CREATE POLICY "admin_notes_select" ON public.interview_notes FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "admin_reminders_select" ON public.reminders;
CREATE POLICY "admin_reminders_select" ON public.reminders FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "admin_documents_select" ON public.documents;
CREATE POLICY "admin_documents_select" ON public.documents FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================
-- 3. ADD INDEX FOR ROLE LOOKUPS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- DONE ✅
-- ============================================

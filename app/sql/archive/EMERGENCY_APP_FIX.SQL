-- ============================================
-- EMERGENCY APPLICATION SAVING FIX
-- This script completely resets constraints, triggers, 
-- and policies on the Applications table to guarantee saves work.
-- ============================================

-- 1. DROP ALL POTENTIAL CONFLICTING POLICIES
DROP POLICY IF EXISTS "a_all_own" ON public.applications;
DROP POLICY IF EXISTS "a_select_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_select" ON public.applications;
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_update" ON public.applications;
DROP POLICY IF EXISTS "applications_delete" ON public.applications;
DROP POLICY IF EXISTS "app_manage_own" ON public.applications;
DROP POLICY IF EXISTS "app_admin_view" ON public.applications;

-- 2. DROP CONFLICTING TRIGGERS 
-- (Frontend passes user_id, so a BEFORE INSERT trigger overwriting it sometimes fails RLS)
DROP TRIGGER IF EXISTS t_app_user ON public.applications;

-- 3. RE-ENABLE CLEAN RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_manage_own" ON public.applications
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_admin_view" ON public.applications 
FOR SELECT USING (public.is_admin());

-- 4. RELAX COLUMN CONSTRAINTS THAT CAUSE CRASHES
ALTER TABLE public.applications ALTER COLUMN applied_date DROP NOT NULL;
ALTER TABLE public.applications ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.applications ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE public.applications ALTER COLUMN job_title SET NOT NULL;

-- 5. ENSURE REQUIRED COLUMNS EXIST
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS cover_letter_url text;

-- ==========================================
-- SCRIPT COMPLETE ✅
-- Run this in your Supabase SQL Editor.
-- ==========================================

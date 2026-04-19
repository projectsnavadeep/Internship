-- ============================================================================
-- NUCLEAR FIX: Application + Document + Profile Saving
-- ⚠️ RUN THIS FIRST in Supabase SQL Editor
-- Then run ADMIN_UPGRADE.SQL second.
-- ============================================================================

-- ============================================
-- 1. DROP ALL DESTRUCTIVE TRIGGERS
-- These triggers overwrite user_id with auth.uid() which returns NULL
-- when the client has a stale session, causing silent data corruption.
-- The frontend already sends the correct user_id, so these are redundant.
-- ============================================
DROP TRIGGER IF EXISTS t_app_user ON public.applications;
DROP TRIGGER IF EXISTS t_docs_user ON public.documents;
DROP TRIGGER IF EXISTS t_notes_user ON public.interview_notes;
DROP TRIGGER IF EXISTS t_reminders_user ON public.reminders;

-- ============================================
-- 2. DROP ALL OLD RLS POLICIES (clean slate)
-- ============================================
DROP POLICY IF EXISTS "a_all_own" ON public.applications;
DROP POLICY IF EXISTS "a_select_admin" ON public.applications;
DROP POLICY IF EXISTS "app_manage_own" ON public.applications;
DROP POLICY IF EXISTS "app_admin_view" ON public.applications;

DROP POLICY IF EXISTS "d_all_own" ON public.documents;
DROP POLICY IF EXISTS "d_select_admin" ON public.documents;

DROP POLICY IF EXISTS "n_all_own" ON public.interview_notes;
DROP POLICY IF EXISTS "n_select_admin" ON public.interview_notes;

DROP POLICY IF EXISTS "r_all_own" ON public.reminders;
DROP POLICY IF EXISTS "r_select_admin" ON public.reminders;

-- ============================================
-- 3. REBUILD RLS WITH EXPLICIT INSERT POLICIES
-- ============================================

-- APPLICATIONS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_select_own" ON public.applications;
DROP POLICY IF EXISTS "app_insert_own" ON public.applications;
DROP POLICY IF EXISTS "app_update_own" ON public.applications;
DROP POLICY IF EXISTS "app_delete_own" ON public.applications;
DROP POLICY IF EXISTS "app_admin_read" ON public.applications;
CREATE POLICY "app_select_own" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "app_insert_own" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app_update_own" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "app_delete_own" ON public.applications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "app_admin_read" ON public.applications FOR SELECT USING (public.is_admin());

-- DOCUMENTS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doc_select_own" ON public.documents;
DROP POLICY IF EXISTS "doc_insert_own" ON public.documents;
DROP POLICY IF EXISTS "doc_update_own" ON public.documents;
DROP POLICY IF EXISTS "doc_delete_own" ON public.documents;
DROP POLICY IF EXISTS "doc_admin_read" ON public.documents;
CREATE POLICY "doc_select_own" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "doc_insert_own" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "doc_update_own" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "doc_delete_own" ON public.documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "doc_admin_read" ON public.documents FOR SELECT USING (public.is_admin());

-- INTERVIEW NOTES
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "note_select_own" ON public.interview_notes;
DROP POLICY IF EXISTS "note_insert_own" ON public.interview_notes;
DROP POLICY IF EXISTS "note_update_own" ON public.interview_notes;
DROP POLICY IF EXISTS "note_delete_own" ON public.interview_notes;
DROP POLICY IF EXISTS "note_admin_read" ON public.interview_notes;
CREATE POLICY "note_select_own" ON public.interview_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "note_insert_own" ON public.interview_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "note_update_own" ON public.interview_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "note_delete_own" ON public.interview_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "note_admin_read" ON public.interview_notes FOR SELECT USING (public.is_admin());

-- REMINDERS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rem_select_own" ON public.reminders;
DROP POLICY IF EXISTS "rem_insert_own" ON public.reminders;
DROP POLICY IF EXISTS "rem_update_own" ON public.reminders;
DROP POLICY IF EXISTS "rem_delete_own" ON public.reminders;
DROP POLICY IF EXISTS "rem_admin_read" ON public.reminders;
CREATE POLICY "rem_select_own" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rem_insert_own" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rem_update_own" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rem_delete_own" ON public.reminders FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "rem_admin_read" ON public.reminders FOR SELECT USING (public.is_admin());

-- ============================================
-- 4. FIX PROFILES RLS (prevents 406 errors)
-- ============================================
DROP POLICY IF EXISTS "p_all_own" ON public.profiles;
DROP POLICY IF EXISTS "p_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profile_admin_update" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_admin_read" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profile_admin_update" ON public.profiles FOR UPDATE USING (public.is_admin());

-- ============================================
-- 5. CLEAN UP ORPHAN ROWS (user_id = NULL)
-- ============================================
DELETE FROM public.applications WHERE user_id IS NULL;
DELETE FROM public.documents WHERE user_id IS NULL;

-- ============================================
-- DONE ✅ Now run ADMIN_UPGRADE.SQL
-- ============================================

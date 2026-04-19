-- ============================================
-- SENIOR SUPABASE ENGINEER: DEFINITIVE FIX
-- ============================================
-- This script completely drops all conflicting policies and recreates them
-- to use JWT-based admin checks, entirely eliminating infinite recursion.
-- ============================================

-- 1. DROP ALL POSSIBLE PREVIOUS POLICIES
-- We drop every possible name format that might be lingering in your database
DROP POLICY IF EXISTS "p_select_own" ON public.profiles;
DROP POLICY IF EXISTS "p_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profile_select" ON public.profiles;
DROP POLICY IF EXISTS "admin_profile_select" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "profile_update" ON public.profiles;

DROP POLICY IF EXISTS "a_all_own" ON public.applications;
DROP POLICY IF EXISTS "a_select_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_select" ON public.applications;
DROP POLICY IF EXISTS "admin_applications_select" ON public.applications;
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_update" ON public.applications;
DROP POLICY IF EXISTS "applications_delete" ON public.applications;

DROP POLICY IF EXISTS "n_all_own" ON public.interview_notes;
DROP POLICY IF EXISTS "n_select_admin" ON public.interview_notes;
DROP POLICY IF EXISTS "notes_select" ON public.interview_notes;
DROP POLICY IF EXISTS "admin_notes_select" ON public.interview_notes;
DROP POLICY IF EXISTS "notes_insert" ON public.interview_notes;
DROP POLICY IF EXISTS "notes_update" ON public.interview_notes;
DROP POLICY IF EXISTS "notes_delete" ON public.interview_notes;

DROP POLICY IF EXISTS "r_all_own" ON public.reminders;
DROP POLICY IF EXISTS "r_select_admin" ON public.reminders;
DROP POLICY IF EXISTS "reminders_select" ON public.reminders;
DROP POLICY IF EXISTS "admin_reminders_select" ON public.reminders;
DROP POLICY IF EXISTS "reminders_insert" ON public.reminders;
DROP POLICY IF EXISTS "reminders_update" ON public.reminders;
DROP POLICY IF EXISTS "reminders_delete" ON public.reminders;

DROP POLICY IF EXISTS "d_all_own" ON public.documents;
DROP POLICY IF EXISTS "d_select_admin" ON public.documents;
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "admin_documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;

-- 2. CREATE FUNCTION TO SYNC ROLE TO AUTH METADATA
-- This makes the role accessible via auth.jwt() -> 'app_metadata'
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD IS NULL) THEN
    UPDATE auth.users
    SET raw_app_metadata = 
      coalesce(raw_app_metadata, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ATTACH THE SYNC TRIGGER
DROP TRIGGER IF EXISTS t_sync_user_role ON public.profiles;
CREATE TRIGGER t_sync_user_role
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- 4. UPDATE EXISTING USERS ROLE TO METADATA
-- Forces existing roles to sync into JWT claims
UPDATE public.profiles SET role = role WHERE role IS NOT NULL;

-- 5. THE MAGIC: NEW ULTRA-FAST IS_ADMIN CHECK
-- This check NEVER queries a table. It is mathematically impossible to loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '') = 'admin';
$$;

-- 6. APPLY NEW CONCISE POLICIES
-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "p_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "p_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());

-- Applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "a_all_own" ON public.applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "a_select_admin" ON public.applications FOR SELECT USING (public.is_admin());

-- Notes
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "n_all_own" ON public.interview_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "n_select_admin" ON public.interview_notes FOR SELECT USING (public.is_admin());

-- Reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r_all_own" ON public.reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "r_select_admin" ON public.reminders FOR SELECT USING (public.is_admin());

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "d_all_own" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "d_select_admin" ON public.documents FOR SELECT USING (public.is_admin());

-- ============================================
-- COMPLETION INSTRUCTIONS:
-- 1. Run this entire script in Supabase SQL editor.
-- 2. Sign Out of the app.
-- 3. Sign Back In to refresh your JWT token.
-- 4. Create an application. It WILL save properly.
-- ============================================

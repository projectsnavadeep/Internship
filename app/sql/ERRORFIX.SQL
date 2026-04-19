-- ============================================
-- SENIOR SDL ULTIMATE RECOVERY SCRIPT
-- ============================================
-- THIS FIXES RECURSION BY MOVING ROLES TO JWT CLAIMS
-- ============================================

-- 1. CLEANUP EVERYTHING
DROP VIEW IF EXISTS public.admin_user_activity CASCADE;
DROP POLICY IF EXISTS "p_select_own" ON public.profiles;
DROP POLICY IF EXISTS "p_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "a_all_own" ON public.applications;
DROP POLICY IF EXISTS "a_select_admin" ON public.applications;
DROP POLICY IF EXISTS "n_all_own" ON public.interview_notes;
DROP POLICY IF EXISTS "n_select_admin" ON public.interview_notes;
DROP POLICY IF EXISTS "r_all_own" ON public.reminders;
DROP POLICY IF EXISTS "r_select_admin" ON public.reminders;
DROP POLICY IF EXISTS "d_all_own" ON public.documents;
DROP POLICY IF EXISTS "d_select_admin" ON public.documents;

-- 2. CREATE FUNCTION TO SYNC ROLE TO AUTH METADATA
-- This makes the role accessible via auth.jwt() -> 'app_metadata'
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the role has genuinely changed to prevent infinite DB triggers
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
-- (Forces a sync for your current local account by creating a dummy update)
UPDATE public.profiles SET role = role WHERE role IS NOT NULL;

-- 5. NEW ULTRA-FAST IS_ADMIN CHECK (NO TABLE SCAN)
-- This check is immune to recursion because it never touches the profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '') = 'admin';
$$;

-- 5.5. RESTORE DATA TYPE & INDEXES
ALTER TABLE public.applications ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;

-- 6. RE-APPLY POLICIES USING JWT CHECK
-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
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
-- IMPORTANT: SIGN OUT AND SIGN BACK IN 
-- AFTER RUNNING THIS FOR THE JWT TO REFRESH
-- ============================================

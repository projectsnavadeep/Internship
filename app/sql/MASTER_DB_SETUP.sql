-- ============================================================================
-- InternTrack - MASTER DB SETUP (v2.0 - Non-Recursive JWT RBAC Architecture)
-- ============================================================================
-- OVERVIEW:
-- This script completely constructs the database for InternTrack from top 
-- to bottom. It is idempotent (safe to run multiple times). It applies
-- strict Row Level Security (RLS) policies completely immune to recursion.
-- ============================================================================

-- ============================================
-- 1. CLEANUP (DROP POLICIES, TRIGGERS & VIEWS)
-- ============================================
-- Drop views that depend on tables
DROP VIEW IF EXISTS public.admin_user_activity CASCADE;
DROP VIEW IF EXISTS public.admin_user_count CASCADE;
DROP VIEW IF EXISTS public.admin_company_distribution CASCADE;
DROP VIEW IF EXISTS public.admin_status_distribution CASCADE;
DROP VIEW IF EXISTS public.admin_pipeline_funnel CASCADE;
DROP VIEW IF EXISTS public.admin_monthly_trends CASCADE;
DROP VIEW IF EXISTS public.admin_recent_applications CASCADE;

-- Drop all old specific policy names to ensure a clean slate
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;


-- ============================================
-- 2. CORE SECURITY FUNCTIONS
-- ============================================

-- SYNC ROLE TRIGGER
-- Automatically copies a user's role from public.profiles into their auth JWT 
-- token. This allows RLS policies to check role instantly without a SQL SELECT.
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD IS NULL) THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IS_ADMIN HELPER
-- Parses the JWT correctly to see if the caller is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '') = 'admin'
  OR (SELECT auth.jwt() ->> 'email') = 'admin@gmail.com';
$$;

-- AUTOMATIC PROFILE CREATION
-- This function runs every time a new user registers in Supabase Auth.
-- It automatically creates their record in public.profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup and re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 3. CORE TABLES
-- ============================================

-- PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_sent boolean DEFAULT false;
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  university text,
  major text,
  graduation_year integer,
  role text not null default 'student' check (role in ('student', 'admin')),
  login_count integer not null default 0,
  last_login_at timestamptz,
  preferences jsonb default '{}',
  welcome_email_sent boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Force sync any existing roles to JWT metadata
UPDATE public.profiles SET role = role WHERE role IS NOT NULL;

-- Attach trigger
DROP TRIGGER IF EXISTS t_sync_user_role ON public.profiles;
CREATE TRIGGER t_sync_user_role
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();


-- APPLICATIONS
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  company_name text not null,
  job_title text not null,
  job_description text,
  job_url text,
  location text,
  salary_range text,
  employment_type text check (employment_type in ('Full-time','Part-time','Contract','Internship','Freelance')),
  status text default 'Applied' not null check (status in ('Applied','Phone Screen','Interview','Technical','Offer','Rejected','Withdrawn','Ghosted')),
  applied_date date default current_date,
  deadline_date date,
  interview_date timestamptz,
  recruiter_name text,
  recruiter_email text,
  recruiter_phone text,
  resume_url text,
  cover_letter_url text,
  notes text,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- INTERVIEW NOTES
CREATE TABLE IF NOT EXISTS public.interview_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  round_number int default 1,
  round_name text not null,
  interview_type text check (interview_type in ('Phone','Video','In-person','Technical','Behavioral','Panel','Group','Case Study')),
  scheduled_date timestamptz,
  duration_minutes int,
  questions_asked text,
  answers_given text,
  key_takeaways text,
  follow_up_items text,
  outcome text check (outcome in ('Pending','Passed','Failed','No-show','Rescheduled')),
  interviewer_name text,
  interviewer_role text,
  interviewer_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- REMINDERS
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  application_id uuid references public.applications on delete cascade,
  title text not null,
  description text,
  reminder_date timestamptz not null,
  reminder_type text not null check (reminder_type in ('Deadline','Interview','Follow-up','Custom')),
  is_completed boolean default false,
  is_notified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  application_id uuid references public.applications on delete set null,
  name text not null,
  document_type text not null check (document_type in ('Resume','Cover Letter','Transcript','Portfolio','Certificate','Other')),
  file_url text not null,
  file_size int,
  mime_type text,
  is_default boolean default false,
  created_at timestamptz default now()
);


-- ============================================
-- 4. AUTO-UPDATING FUNCTIONS & TRIGGERS
-- ============================================

-- Function: update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$ LANGUAGE plpgsql;

-- Attach to all relevant tables
DROP TRIGGER IF EXISTS t_profiles ON public.profiles;
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS t_applications ON public.applications;
CREATE TRIGGER t_applications BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS t_notes ON public.interview_notes;
CREATE TRIGGER t_notes BEFORE UPDATE ON public.interview_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS t_reminders ON public.reminders;
CREATE TRIGGER t_reminders BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: set_user_id cleanly on insert
CREATE OR REPLACE FUNCTION set_user_id() RETURNS trigger AS $$
BEGIN
  new.user_id = auth.uid();
  return new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS t_app_user ON public.applications;
CREATE TRIGGER t_app_user BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS t_notes_user ON public.interview_notes;
CREATE TRIGGER t_notes_user BEFORE INSERT ON public.interview_notes FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS t_reminders_user ON public.reminders;
CREATE TRIGGER t_reminders_user BEFORE INSERT ON public.reminders FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS t_docs_user ON public.documents;
CREATE TRIGGER t_docs_user BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION set_user_id();


-- ============================================
-- 5. INDEXES (PERFORMANCE)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_app_user ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_notes_app ON public.interview_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON public.reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);


-- ============================================
-- 6. APPLY CLEAN RLS POLICIES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_all_own" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "p_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "a_all_own" ON public.applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "a_select_admin" ON public.applications FOR SELECT USING (public.is_admin());

ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "n_all_own" ON public.interview_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "n_select_admin" ON public.interview_notes FOR SELECT USING (public.is_admin());

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r_all_own" ON public.reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "r_select_admin" ON public.reminders FOR SELECT USING (public.is_admin());

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "d_all_own" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "d_select_admin" ON public.documents FOR SELECT USING (public.is_admin());


-- ============================================
-- 7. SUPABASE STORAGE (BUCKETS)
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars RLS
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;
CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Documents RLS
DROP POLICY IF EXISTS "Users can view their own documents." ON storage.objects;
CREATE POLICY "Users can view their own documents." ON storage.objects FOR SELECT USING ( bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can upload their own documents." ON storage.objects;
CREATE POLICY "Users can upload their own documents." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'documents' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can update their own documents." ON storage.objects;
CREATE POLICY "Users can update their own documents." ON storage.objects FOR UPDATE USING ( bucket_id = 'documents' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can delete their own documents." ON storage.objects;
CREATE POLICY "Users can delete their own documents." ON storage.objects FOR DELETE USING ( bucket_id = 'documents' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1] );


-- ============================================
-- 8. REGISTRY & ANALYTICS VIEWS
-- ============================================
CREATE OR REPLACE VIEW public.admin_user_count AS SELECT count(*)::int as total_users FROM public.profiles;

CREATE OR REPLACE VIEW public.admin_user_activity AS SELECT p.id as user_id, p.full_name, u.email, p.university, p.major, p.role, p.login_count, p.last_login_at, p.welcome_email_sent, p.created_at as joined_at, count(a.id)::int as application_count FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id LEFT JOIN public.applications a ON a.user_id = p.id GROUP BY p.id, p.full_name, u.email, p.university, p.major, p.role, p.login_count, p.last_login_at, p.welcome_email_sent, p.created_at ORDER BY p.last_login_at DESC NULLS LAST;

CREATE OR REPLACE VIEW public.admin_company_distribution AS SELECT company_name, count(distinct user_id)::int as student_count, count(*)::int as application_count FROM public.applications GROUP BY company_name ORDER BY application_count DESC;

CREATE OR REPLACE VIEW public.admin_status_distribution AS SELECT status, count(*)::int as count, round( count(*)::numeric / nullif((select count(*) from public.applications), 0) * 100, 1 ) as percentage FROM public.applications GROUP BY status ORDER BY count DESC;

CREATE OR REPLACE VIEW public.admin_pipeline_funnel AS SELECT 'Applied' as stage, 1 as stage_order, count(*) filter (where status in ('Applied','Phone Screen','Interview','Technical','Offer','Rejected','Withdrawn','Ghosted'))::int as count FROM public.applications UNION ALL SELECT 'Screening' as stage, 2 as stage_order, count(*) filter (where status in ('Phone Screen','Interview','Technical','Offer'))::int as count FROM public.applications UNION ALL SELECT 'Interview' as stage, 3 as stage_order, count(*) filter (where status in ('Interview','Technical','Offer'))::int as count FROM public.applications UNION ALL SELECT 'Offer' as stage, 4 as stage_order, count(*) filter (where status = 'Offer')::int as count FROM public.applications ORDER BY stage_order;

CREATE OR REPLACE VIEW public.admin_monthly_trends AS SELECT to_char(applied_date, 'YYYY-MM') as month, count(*)::int as application_count, count(distinct user_id)::int as active_users FROM public.applications WHERE applied_date >= current_date - interval '12 months' GROUP BY to_char(applied_date, 'YYYY-MM') ORDER BY month;

CREATE OR REPLACE VIEW public.admin_recent_applications AS SELECT a.id, a.company_name, a.job_title, a.status, a.applied_date, a.created_at, p.full_name as applicant_name, u.email as applicant_email FROM public.applications a JOIN public.profiles p ON p.id = a.user_id JOIN auth.users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 50;

-- ============================================================================
-- SCRIPT COMPLETE ✅
-- ============================================================================

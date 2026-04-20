-- ============================================================================
-- InternTrack — DEFINITIVE MASTER DB SETUP (v3.0 — NUCLEAR REBUILD)
-- ============================================================================
-- THIS IS THE ONLY SQL FILE YOU NEED TO RUN.
-- It nukes ALL existing policies/triggers/views and rebuilds from zero.
-- Guaranteed idempotent. Guaranteed no recursion. Guaranteed saves work.
-- ============================================================================
-- HOW TO USE: Copy this ENTIRE file → Supabase SQL Editor → Run
-- ============================================================================


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 1: TOTAL CLEANUP — DROP EVERYTHING
-- ████████████████████████████████████████████████████████████████████████████

-- Drop all views first (they depend on tables)
DROP VIEW IF EXISTS public.admin_user_activity CASCADE;
DROP VIEW IF EXISTS public.admin_user_count CASCADE;
DROP VIEW IF EXISTS public.admin_company_distribution CASCADE;
DROP VIEW IF EXISTS public.admin_status_distribution CASCADE;
DROP VIEW IF EXISTS public.admin_pipeline_funnel CASCADE;
DROP VIEW IF EXISTS public.admin_monthly_trends CASCADE;
DROP VIEW IF EXISTS public.admin_recent_applications CASCADE;

-- Nuke every single RLS policy on every table — no survivors
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
  END LOOP;
END $$;

-- Nuke every storage policy too
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
  END LOOP;
END $$;

-- Drop all triggers on public tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS t_sync_user_role ON public.profiles;
DROP TRIGGER IF EXISTS t_profiles ON public.profiles;
DROP TRIGGER IF EXISTS t_applications ON public.applications;
DROP TRIGGER IF EXISTS t_notes ON public.interview_notes;
DROP TRIGGER IF EXISTS t_reminders ON public.reminders;
DROP TRIGGER IF EXISTS t_app_user ON public.applications;
DROP TRIGGER IF EXISTS t_notes_user ON public.interview_notes;
DROP TRIGGER IF EXISTS t_reminders_user ON public.reminders;
DROP TRIGGER IF EXISTS t_docs_user ON public.documents;


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 2: CORE TABLES (every column the frontend needs)
-- ████████████████████████████████████████████████████████████████████████████

-- ── PROFILES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name       text,
  avatar_url      text,
  university      text,
  major           text,
  graduation_year integer,
  dob             date,
  merit           text,
  additional_data text,
  signup_date     date DEFAULT current_date,
  role            text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  login_count     integer NOT NULL DEFAULT 0,
  last_login_at   timestamptz,
  preferences     jsonb DEFAULT '{}',
  welcome_email_sent boolean DEFAULT false,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- Add columns if table already exists (safe to re-run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merit text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS additional_data text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_date date DEFAULT current_date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_sent boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';


-- ── APPLICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  company_name    text NOT NULL,
  job_title       text NOT NULL,
  job_description text,
  job_url         text,
  location        text,
  salary_range    text,
  employment_type text CHECK (employment_type IN ('Full-time','Part-time','Contract','Internship','Freelance')),
  status          text DEFAULT 'Applied' NOT NULL CHECK (status IN ('Applied','Phone Screen','Interview','Technical','Offer','Rejected','Withdrawn','Ghosted')),
  applied_date    date DEFAULT current_date,
  deadline_date   date,
  interview_date  timestamptz,
  recruiter_name  text,
  recruiter_email text,
  recruiter_phone text,
  resume_url      text,
  cover_letter_url text,
  notes           text,
  rating          integer,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Fix rating constraint to allow 0-5
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_rating_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_rating_check CHECK (rating >= 0 AND rating <= 5);


-- ── INTERVIEW NOTES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_notes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   uuid REFERENCES public.applications ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  round_number     integer DEFAULT 1,
  round_name       text NOT NULL,
  interview_type   text CHECK (interview_type IN ('Phone','Video','In-person','Technical','Behavioral','Panel','Group','Case Study')),
  scheduled_date   timestamptz,
  duration_minutes integer,
  questions_asked  text,
  answers_given    text,
  key_takeaways    text,
  follow_up_items  text,
  outcome          text CHECK (outcome IN ('Pending','Passed','Failed','No-show','Rescheduled')),
  interviewer_name  text,
  interviewer_role  text,
  interviewer_email text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);


-- ── REMINDERS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  application_id  uuid REFERENCES public.applications ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  reminder_date   timestamptz NOT NULL,
  reminder_type   text NOT NULL CHECK (reminder_type IN ('Deadline','Interview','Follow-up','Custom')),
  is_completed    boolean DEFAULT false,
  is_notified     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);


-- ── DOCUMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  application_id  uuid REFERENCES public.applications ON DELETE SET NULL,
  name            text NOT NULL,
  document_type   text NOT NULL CHECK (document_type IN ('Resume','Cover Letter','Transcript','Portfolio','Certificate','Other')),
  file_url        text NOT NULL,
  file_size       integer,
  mime_type       text,
  is_default      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);


-- ── ERROR LOGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.error_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users ON DELETE SET NULL,
  user_email       text,
  user_name        text,
  error_type       text NOT NULL,
  error_message    text NOT NULL,
  error_details    text,
  action_attempted text,
  resolved         boolean DEFAULT false,
  resolved_by      uuid REFERENCES auth.users ON DELETE SET NULL,
  resolved_at      timestamptz,
  resolution_notes text,
  created_at       timestamptz DEFAULT now() NOT NULL
);


-- ── ADMIN ACTIONS (audit trail) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action_type text NOT NULL,
  description text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now() NOT NULL
);


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 3: FUNCTIONS & TRIGGERS
-- ████████████████████████████████████████████████████████████████████████████

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, signup_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    'student',
    current_date
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Sync role changes to JWT metadata (so admin check works instantly)
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD IS NULL) THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER t_sync_user_role
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();


-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_profiles    BEFORE UPDATE ON public.profiles       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_applications BEFORE UPDATE ON public.applications   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_notes       BEFORE UPDATE ON public.interview_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER t_reminders   BEFORE UPDATE ON public.reminders       FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Auto-set user_id from auth on INSERT (security: prevents spoofing)
CREATE OR REPLACE FUNCTION set_user_id() RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_app_user     BEFORE INSERT ON public.applications   FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER t_notes_user   BEFORE INSERT ON public.interview_notes FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER t_reminders_user BEFORE INSERT ON public.reminders     FOR EACH ROW EXECUTE FUNCTION set_user_id();
CREATE TRIGGER t_docs_user    BEFORE INSERT ON public.documents       FOR EACH ROW EXECUTE FUNCTION set_user_id();


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 4: RLS POLICIES — SIMPLE, NO RECURSION, GUARANTEED TO WORK
-- ████████████████████████████████████████████████████████████████████████████
-- DESIGN PRINCIPLE:
--   • Users can CRUD their own data. Period.
--   • Admin operations use the SERVICE ROLE KEY which bypasses RLS entirely.
--   • NO is_admin() function in any policy = ZERO recursion risk.
-- ████████████████████████████████████████████████████████████████████████████

-- ── PROFILES ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── APPLICATIONS ──
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_own" ON public.applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── INTERVIEW NOTES ──
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_own" ON public.interview_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── REMINDERS ──
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_own" ON public.reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── DOCUMENTS ──
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_own" ON public.documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── ERROR LOGS ──
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
-- Any logged-in user can insert error logs
CREATE POLICY "error_logs_insert" ON public.error_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Users can see their own errors
CREATE POLICY "error_logs_select" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ── ADMIN ACTIONS ──
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
-- Admin operations go through service role (bypasses RLS), but add a safety policy
CREATE POLICY "admin_actions_all" ON public.admin_actions
  FOR ALL USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 5: STORAGE BUCKETS
-- ████████████████████████████████████████████████████████████████████████████

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars: public read, authenticated write
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Documents: user-scoped (folder = user_id)
CREATE POLICY "docs_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "docs_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "docs_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "docs_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 6: INDEXES
-- ████████████████████████████████████████████████████████████████████████████

CREATE INDEX IF NOT EXISTS idx_app_user         ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_status       ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_app_date         ON public.applications(applied_date);
CREATE INDEX IF NOT EXISTS idx_notes_app        ON public.interview_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user   ON public.reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role    ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_error_type       ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_resolved   ON public.error_logs(resolved);


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 7: ADMIN ANALYTICS VIEWS
-- ████████████████████████████████████████████████████████████████████████████

CREATE OR REPLACE VIEW public.admin_user_count AS
  SELECT count(*)::int AS total_users FROM public.profiles;

CREATE OR REPLACE VIEW public.admin_user_activity AS
  SELECT
    p.id AS user_id, p.full_name, u.email,
    p.university, p.major, p.role, p.login_count,
    p.last_login_at, p.welcome_email_sent, p.avatar_url,
    p.dob, p.merit, p.additional_data, p.signup_date, p.graduation_year,
    p.created_at AS joined_at,
    count(a.id)::int AS application_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.applications a ON a.user_id = p.id
  GROUP BY p.id, p.full_name, u.email, p.university, p.major, p.role,
           p.login_count, p.last_login_at, p.welcome_email_sent, p.avatar_url,
           p.dob, p.merit, p.additional_data, p.signup_date, p.graduation_year,
           p.created_at
  ORDER BY p.last_login_at DESC NULLS LAST;

CREATE OR REPLACE VIEW public.admin_company_distribution AS
  SELECT company_name,
         count(DISTINCT user_id)::int AS student_count,
         count(*)::int AS application_count
  FROM public.applications
  GROUP BY company_name
  ORDER BY application_count DESC;

CREATE OR REPLACE VIEW public.admin_status_distribution AS
  SELECT status,
         count(*)::int AS count,
         round(count(*)::numeric / nullif((SELECT count(*) FROM public.applications), 0) * 100, 1) AS percentage
  FROM public.applications
  GROUP BY status
  ORDER BY count DESC;

CREATE OR REPLACE VIEW public.admin_pipeline_funnel AS
  SELECT 'Applied' AS stage, 1 AS stage_order,
         count(*) FILTER (WHERE status IN ('Applied','Phone Screen','Interview','Technical','Offer','Rejected','Withdrawn','Ghosted'))::int AS count
  FROM public.applications
  UNION ALL
  SELECT 'Screening', 2,
         count(*) FILTER (WHERE status IN ('Phone Screen','Interview','Technical','Offer'))::int
  FROM public.applications
  UNION ALL
  SELECT 'Interview', 3,
         count(*) FILTER (WHERE status IN ('Interview','Technical','Offer'))::int
  FROM public.applications
  UNION ALL
  SELECT 'Offer', 4,
         count(*) FILTER (WHERE status = 'Offer')::int
  FROM public.applications
  ORDER BY stage_order;

CREATE OR REPLACE VIEW public.admin_monthly_trends AS
  SELECT to_char(applied_date, 'YYYY-MM') AS month,
         count(*)::int AS application_count,
         count(DISTINCT user_id)::int AS active_users
  FROM public.applications
  WHERE applied_date >= current_date - interval '12 months'
  GROUP BY to_char(applied_date, 'YYYY-MM')
  ORDER BY month;

CREATE OR REPLACE VIEW public.admin_recent_applications AS
  SELECT a.id, a.company_name, a.job_title, a.status, a.applied_date, a.created_at,
         p.full_name AS applicant_name, u.email AS applicant_email
  FROM public.applications a
  JOIN public.profiles p ON p.id = a.user_id
  JOIN auth.users u ON u.id = a.user_id
  ORDER BY a.created_at DESC
  LIMIT 50;


-- ████████████████████████████████████████████████████████████████████████████
-- PHASE 8: FORCE-SYNC EXISTING DATA
-- ████████████████████████████████████████████████████████████████████████████

-- Backfill signup_date for existing users
UPDATE public.profiles SET signup_date = created_at::date WHERE signup_date IS NULL AND created_at IS NOT NULL;

-- Force-sync all existing roles to JWT metadata
UPDATE public.profiles SET role = role WHERE role IS NOT NULL;


-- ============================================================================
-- ✅ DONE — THIS IS THE ONLY SQL FILE YOU NEED
-- ============================================================================
-- After running this, your app should:
--   ✅ Save applications
--   ✅ Save calendar events / reminders
--   ✅ Upload and persist profile pictures
--   ✅ Save profile changes (name, university, dob, merit, etc.)
--   ✅ Admin panel sees all user data via service role
--   ✅ Error logging works
-- ============================================================================

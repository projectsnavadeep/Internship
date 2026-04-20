-- ============================================
-- 03_applications.sql
-- Applications, Interview Notes, and Documents.
-- ============================================

-- 1. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  job_title text NOT NULL,
  job_description text,
  job_url text,
  location text,
  salary_range text,
  employment_type text CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance')),
  status text NOT NULL DEFAULT 'Applied',
  applied_date date DEFAULT current_date,
  deadline_date date,
  interview_date timestamptz,
  recruiter_name text,
  recruiter_email text,
  recruiter_phone text,
  resume_url text,
  cover_letter_url text,
  notes text,
  rating integer CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Interview Notes Table
CREATE TABLE IF NOT EXISTS public.interview_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  round_number integer DEFAULT 1,
  round_name text NOT NULL,
  interview_type text,
  scheduled_date timestamptz,
  duration_minutes integer,
  questions_asked text,
  answers_given text,
  key_takeaways text,
  follow_up_items text,
  outcome text,
  interviewer_name text,
  interviewer_role text,
  interviewer_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  name text NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. Data Migration
DO $$
BEGIN
    -- Applications
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_applications') THEN
        INSERT INTO public.applications (id, user_id, company_name, job_title, status, applied_date, created_at, updated_at)
        SELECT id, user_id, company_name, job_title, status, applied_date, created_at, updated_at
        FROM public.legacy_applications
        WHERE user_id IN (SELECT id FROM public.profiles)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Interview Notes
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_interview_notes') THEN
        INSERT INTO public.interview_notes (id, application_id, user_id, round_name, created_at, updated_at)
        SELECT id, application_id, user_id, round_name, created_at, updated_at
        FROM public.legacy_interview_notes
        WHERE user_id IN (SELECT id FROM public.profiles)
        AND application_id IN (SELECT id FROM public.applications)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Documents
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_documents') THEN
        INSERT INTO public.documents (id, user_id, application_id, name, document_type, file_url, created_at)
        SELECT id, user_id, application_id, name, document_type, file_url, created_at
        FROM public.legacy_documents
        WHERE user_id IN (SELECT id FROM public.profiles)
        AND (application_id IS NULL OR application_id IN (SELECT id FROM public.applications))
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 5. RLS Policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own applications" 
  ON public.applications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own notes" 
  ON public.interview_notes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD their own documents" 
  ON public.documents FOR ALL USING (auth.uid() = user_id);

-- Admin Global View
CREATE POLICY "Admins can view all applications" 
  ON public.applications FOR SELECT USING (public.is_admin());

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_notes_application_id ON public.interview_notes(application_id);

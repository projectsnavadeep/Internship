-- ============================================================================
-- MASTER RECOVERY SCRIPT: Applications, Documents, and Storage Persistence
-- 🚀 Purpose: Resolve "silent save" failures, upload errors, and Corrupt sessions.
-- ============================================================================

-- 1. CLEAN UP TRIGGERS (Source of "user_id = NULL" bugs)
-- We remove triggers that auto-overwrite user_id. The App already passes the correct ID.
DROP TRIGGER IF EXISTS t_app_user ON public.applications;
DROP TRIGGER IF EXISTS t_docs_user ON public.documents;
DROP TRIGGER IF EXISTS t_notes_user ON public.interview_notes;
DROP TRIGGER IF EXISTS t_reminders_user ON public.reminders;

-- 2. RESET RLS POLICIES (Consolidated approach)
-- Applications
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

-- Documents
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

-- 3. STORAGE RECOVERY (Fix Upload Failures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all old specific storage policies for documents
DROP POLICY IF EXISTS "Users can upload their own documents." ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents." ON storage.objects;

-- Create robust ownership policies for the storage bucket
-- This uses the folder structure: documents/{user_id}/{filename}
CREATE POLICY "doc_storage_read" ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "doc_storage_insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "doc_storage_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. CLEAN UP CORRUPTION (Delete rows with NULL user_ids that bypass security)
DELETE FROM public.applications WHERE user_id IS NULL;
DELETE FROM public.documents WHERE user_id IS NULL;

-- 5. RELAX CONSTRAINTS (Ensure partial saves don't crash)
ALTER TABLE public.applications ALTER COLUMN applied_date DROP NOT NULL;
ALTER TABLE public.applications ALTER COLUMN status SET DEFAULT 'Pending';

-- FINAL CHECK: Ensure column existence
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_date timestamptz;

-- SCRIPT COMPLETE ✅

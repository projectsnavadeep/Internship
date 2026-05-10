-- ============================================
-- DOCUMENT UPLOAD SYSTEM RECOVERY SCRIPT 
-- ============================================
-- This script ensures the documents table and storage bucket
-- have explicit, robust permissions for end-users.
-- ============================================

-- 1. Ensure Table Permissions are Explicit
DROP POLICY IF EXISTS "d_all_own" ON public.documents;
DROP POLICY IF EXISTS "d_select_admin" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Select: Own documents or Admin
CREATE POLICY "documents_select" ON public.documents 
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Insert: Authenticated users can insert their own docs
CREATE POLICY "documents_insert" ON public.documents 
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Update: Own docs
CREATE POLICY "documents_update" ON public.documents 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Delete: Own docs
CREATE POLICY "documents_delete" ON public.documents 
  FOR DELETE USING (auth.uid() = user_id);


-- 2. Ensure Storage Bucket & Policies
-- (Idempotent creation)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Select
DROP POLICY IF EXISTS "Users can view their own documents." ON storage.objects;
CREATE POLICY "Users can view their own documents."
  ON storage.objects FOR SELECT
  USING ( 
    bucket_id = 'documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

-- Storage Insert
DROP POLICY IF EXISTS "Users can upload their own documents." ON storage.objects;
CREATE POLICY "Users can upload their own documents."
  ON storage.objects FOR INSERT
  WITH CHECK ( 
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Update
DROP POLICY IF EXISTS "Users can update their own documents." ON storage.objects;
CREATE POLICY "Users can update their own documents."
  ON storage.objects FOR UPDATE
  USING ( 
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Delete
DROP POLICY IF EXISTS "Users can delete their own documents." ON storage.objects;
CREATE POLICY "Users can delete their own documents."
  ON storage.objects FOR DELETE
  USING ( 
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- VERIFICATION:
-- 1. Run this in Supabase SQL Editor.
-- 2. Test document upload. It should now persist correctly.
-- ============================================

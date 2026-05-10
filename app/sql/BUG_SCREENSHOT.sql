-- ============================================
-- BUG_SCREENSHOT.sql
-- Adds screenshot support to bug reports.
-- Safe to run on existing data (nullable column).
-- ============================================

-- 1. Add screenshot_url column (no-op if already exists) 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'error_logs'
          AND column_name = 'screenshot_url'
    ) THEN
        ALTER TABLE public.error_logs ADD COLUMN screenshot_url text;
    END IF;
END $$;

-- 2. Storage: Ensure the documents bucket exists (bug screenshots go here)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INSTRUCTIONS:
-- 1. Run this in Supabase SQL Editor.
-- 2. Bug report screenshots will be stored in documents bucket
--    under the path: {user_id}/bug-reports/{filename}
-- ============================================

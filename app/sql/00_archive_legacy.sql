-- ============================================
-- 00_archive_legacy.sql
-- Safely renames existing tables to preserve data.
-- Run this BEFORE the new schema scripts.
-- ============================================

DO $$ 
BEGIN
    -- Rename public tables to legacy_*
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE public.profiles RENAME TO legacy_profiles;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') THEN
        ALTER TABLE public.applications RENAME TO legacy_applications;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'interview_notes') THEN
        ALTER TABLE public.interview_notes RENAME TO legacy_interview_notes;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        ALTER TABLE public.reminders RENAME TO legacy_reminders;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        ALTER TABLE public.documents RENAME TO legacy_documents;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'error_logs') THEN
        ALTER TABLE public.error_logs RENAME TO legacy_error_logs;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_actions') THEN
        ALTER TABLE public.admin_actions RENAME TO legacy_admin_actions;
    END IF;

END $$;

-- ============================================================================
-- ERROR LOGS + ADMIN POWERS UPGRADE
-- Run this in Supabase SQL Editor AFTER running NUCLEAR_FIX.SQL
-- ============================================================================

-- ============================================
-- 1. ERROR LOGS TABLE
-- Captures user errors in real-time for admin monitoring
-- ============================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  user_email text,
  user_name text,
  error_type text NOT NULL CHECK (error_type IN (
    'auth', 'application_save', 'application_update', 'application_delete',
    'resume_upload', 'cover_letter_upload', 'document_upload', 'document_delete',
    'profile_update', 'password_change', 'avatar_upload',
    'data_load', 'unknown'
  )),
  error_message text NOT NULL,
  error_details text,
  action_attempted text,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast admin queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

-- RLS: Users can insert their own errors, admins can see and manage all
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_log_insert" ON public.error_logs;
CREATE POLICY "error_log_insert" ON public.error_logs
  FOR INSERT WITH CHECK (true); -- Anyone authenticated can log errors

DROP POLICY IF EXISTS "error_log_select_own" ON public.error_logs;
CREATE POLICY "error_log_select_own" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "error_log_admin_manage" ON public.error_logs;
CREATE POLICY "error_log_admin_manage" ON public.error_logs
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "error_log_admin_delete" ON public.error_logs;
CREATE POLICY "error_log_admin_delete" ON public.error_logs
  FOR DELETE USING (public.is_admin());

-- ============================================
-- 2. ADMIN ACTIVITY LOG (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN (
    'resolve_error', 'delete_user', 'promote_user', 'demote_user',
    'reset_password', 'send_email', 'purge_data', 'system_config'
  )),
  target_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON public.admin_actions(created_at DESC);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_actions_admin_only" ON public.admin_actions
  FOR ALL USING (public.is_admin());

-- ============================================
-- DONE ✅
-- ============================================

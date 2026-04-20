-- ============================================
-- 05_error_logs.sql
-- Production-grade Error Tracking System.
-- ============================================

-- 1. Error Logs Table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  role text DEFAULT 'system' CHECK (role IN ('student', 'admin', 'system')),
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  source text DEFAULT 'frontend',
  endpoint_or_file text,
  status_code integer,
  action_attempted text,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- 2. Data Migration
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_error_logs') THEN
        INSERT INTO public.error_logs (
            id, user_id, user_email, user_name, error_type, error_message, 
            action_attempted, resolved, resolved_by, resolved_at, 
            resolution_notes, created_at
        )
        SELECT 
            id, user_id, user_email, user_name, error_type, error_message, 
            action_attempted, resolved, resolved_by, resolved_at, 
            resolution_notes, created_at
        FROM public.legacy_error_logs
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous users (during auth failures) or logged in users can insert
CREATE POLICY "Anyone can insert error logs" 
  ON public.error_logs FOR INSERT WITH CHECK (true);

-- Admins can view and manage all logs
CREATE POLICY "Admins can manage all error logs" 
  ON public.error_logs FOR ALL USING (public.is_admin());

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

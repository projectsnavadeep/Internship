-- ============================================
-- 07_sessions.sql
-- Unified Activity Logging and Daily Session Tracking.
-- ============================================

-- 1. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- 3. RLS Policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs" 
  ON public.activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" 
  ON public.activity_logs FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "System can insert activity logs" 
  ON public.activity_logs FOR INSERT 
  WITH CHECK (true); -- Usually restricted to authenticated users in code

-- 4. Daily Sessions View
-- Aggregates activity into daily buckets with a unique Session ID.
CREATE OR REPLACE VIEW public.daily_sessions AS
SELECT 
  al.user_id,
  p.full_name as user_name,
  p.role as user_role,
  date(al.created_at) as session_date,
  -- Generate a stable Session ID: e.g., MAY08(A1B2)
  upper(to_char(date(al.created_at), 'MONDD')) || '(' || upper(substring(md5(al.user_id::text || date(al.created_at)::text), 1, 4)) || ')' as session_id,
  count(*) as total_actions,
  json_agg(json_build_object(
    'id', al.id,
    'time', al.created_at,
    'type', al.action_type,
    'description', al.description,
    'metadata', al.metadata
  ) ORDER BY al.created_at DESC) as activity_stream
FROM public.activity_logs al
JOIN public.profiles p ON al.user_id = p.id
GROUP BY al.user_id, p.full_name, p.role, date(al.created_at);

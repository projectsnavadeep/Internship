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

-- 4. Session ID Auto-Generation Trigger
-- Ensures every log entry has a valid session_id in metadata
CREATE OR REPLACE FUNCTION public.set_activity_session_id()
RETURNS TRIGGER AS $$
DECLARE
  generated_session_id text;
BEGIN
  -- Generate one session id per day for this user: e.g., MAY08(A1B2)
  generated_session_id := upper(to_char(date(NEW.created_at), 'MONDD')) || '(' || upper(substring(md5(NEW.user_id::text || date(NEW.created_at)::text), 1, 4)) || ')' ;
  
  -- Inject into metadata to replace "UNKNOWN" from frontend telemetry
  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  END IF;
  
  NEW.metadata := jsonb_set(NEW.metadata, '{session_id}', to_jsonb(generated_session_id));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_activity_session_id ON public.activity_logs;
CREATE TRIGGER trg_set_activity_session_id
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_activity_session_id();

-- 5. Daily Sessions View
-- Aggregates activity into daily buckets with a unique Session ID.
CREATE OR REPLACE VIEW public.daily_sessions AS
SELECT 
  al.user_id,
  p.full_name as user_name,
  p.role as user_role,
  date(al.created_at) as session_date,
  -- Use the generated session_id from metadata or fallback to computed
  COALESCE(al.metadata->>'session_id', upper(to_char(date(al.created_at), 'MONDD')) || '(' || upper(substring(md5(al.user_id::text || date(al.created_at)::text), 1, 4)) || ')') as session_id,
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
GROUP BY al.user_id, p.full_name, p.role, date(al.created_at), al.metadata->>'session_id';

-- 6. Retroactive Fix for 'UNKNOWN' sessions
-- Updates all existing records that were logged before this trigger was added
UPDATE public.activity_logs
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb), 
  '{session_id}', 
  to_jsonb(upper(to_char(date(created_at), 'MONDD')) || '(' || upper(substring(md5(user_id::text || date(created_at)::text), 1, 4)) || ')')
)
WHERE metadata->>'session_id' = 'UNKNOWN' OR metadata->>'session_id' IS NULL;

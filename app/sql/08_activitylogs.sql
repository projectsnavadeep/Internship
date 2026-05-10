UPDATE public.activity_logs
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb), 
  '{session_id}', 
  to_jsonb(upper(to_char(date(created_at), 'MONDD')) || '(' || upper(substring(md5(user_id::text || date(created_at)::text), 1, 4)) || ')')
)
WHERE metadata->>'session_id' = 'UNKNOWN' OR metadata->>'session_id' IS NULL;

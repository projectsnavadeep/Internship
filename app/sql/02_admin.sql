-- ============================================
-- 02_admin.sql  
-- Admin helper functions and Audit logging.
-- ============================================

-- 1. Admin Helper Function (JWT-based but with profile fallback)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Admin Actions Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action_type text NOT NULL,
  target_id uuid,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Data Migration from legacy
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_admin_actions') THEN
        INSERT INTO public.admin_actions (id, admin_id, action_type, description, metadata, created_at)
        SELECT id, admin_id, action_type, description, metadata, created_at
        FROM public.legacy_admin_actions
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 4. RLS for Admin Actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all actions" 
  ON public.admin_actions FOR SELECT 
  USING (public.is_admin());

-- 5. Admin-only policies for Profiles
-- Adding these here as they depend on is_admin()
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
  ON public.profiles FOR UPDATE 
  USING (public.is_admin());

-- 🛡️ ULTIMATE ADMIN POWER SCRIPT (Fixed Typo)
-- 1. FIX THE SECURITY OVERRIDE
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '') = 'admin'
  OR (SELECT auth.jwt() ->> 'email') = 'admin@gmail.com';
$$;

-- 2. APPLY POWER TO admin@gmail.com
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@gmail.com');

-- 3. FORCE AUTH METADATA SYNC (Corrected Column Name)
UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@gmail.com';

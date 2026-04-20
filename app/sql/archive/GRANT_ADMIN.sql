-- ============================================================================
-- InternTrack — GRANT ADMIN ROLE
-- ============================================================================
-- Run this AFTER MASTER_DB_SETUP.sql to promote a user to admin.
-- Replace the email below with your admin email.
-- ============================================================================

-- Option 1: Grant admin by email
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@gmail.com'
);

-- Verify it worked
SELECT p.id, u.email, p.role, p.full_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin';

-- ============================================================================
-- ✅ DONE
-- ============================================================================

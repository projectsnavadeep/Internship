-- ============================================
-- InternTrack - Admin Account Seed Script
-- ============================================
-- Run this in the Supabase SQL Editor AFTER the schema has been applied.
--
-- The absolute safely, most secure way to create an admin user in Supabase
-- is to securely register via your app's frontend, and then 
-- promote that user to admin via SQL.

-- STEP 1 ==============================================
-- Go to your app (http://localhost:5173) and sign up via the Auth form with:
-- Email: admin@gmail.com
-- Password: 114462
-- Full Name: System Admin

-- STEP 2 ==============================================
-- Now Run this SQL command to promote the newly created user to Admin:

UPDATE public.profiles
SET 
  role = 'admin', 
  full_name = 'System Admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@gmail.com'
);

-- ============================================
-- Verify admin was created
-- ============================================
-- SELECT id, full_name, role FROM public.profiles WHERE role = 'admin';

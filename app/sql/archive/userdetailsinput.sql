-- ============================================
-- INTERNTRACK: FINAL DATABASE COMPATIBILITY FIX (ULTIMATE)
-- ============================================
-- THIS VERSION HANDLES VIEW DEPENDENCIES AND POLICY DEPENDENCIES
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ============================================

-- 1. DROP ALL VIEWS THAT DEPEND ON THE APPLICATIONS TABLE
-- (PostgreSQL blocks column type changes if a VIEW uses the column)
DROP VIEW IF EXISTS public.admin_user_activity CASCADE;
DROP VIEW IF EXISTS public.admin_company_distribution CASCADE;
DROP VIEW IF EXISTS public.admin_status_distribution CASCADE;
DROP VIEW IF EXISTS public.admin_pipeline_funnel CASCADE;
DROP VIEW IF EXISTS public.admin_monthly_trends CASCADE;
DROP VIEW IF EXISTS public.admin_recent_applications CASCADE;

-- 2. DROP ALL POLICIES ON APPLICATIONS AND PROFILES
-- (Policies also block column type changes)
DROP POLICY IF EXISTS "applications_select" ON public.applications;
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_update" ON public.applications;
DROP POLICY IF EXISTS "applications_delete" ON public.applications;
DROP POLICY IF EXISTS "admin_applications_select" ON public.applications;
DROP POLICY IF EXISTS "profile_select" ON public.profiles;
DROP POLICY IF EXISTS "admin_profile_select" ON public.profiles;

-- 3. DROP TRIGGERS
DROP TRIGGER IF EXISTS t_app_user ON public.applications;

-- 4. CREATE THE NON-RECURSIVE SECURITY DEFINER HELPER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 5. FIX THE DATA TYPES (UUID)
-- We use USING to safely cast existing strings to UUIDs
ALTER TABLE public.applications ALTER COLUMN user_id SET DATA TYPE uuid USING user_id::uuid;

-- 6. RECREATE THE TRIGGERS
CREATE OR REPLACE FUNCTION set_user_id() RETURNS trigger AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_app_user BEFORE INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 7. RECREATE THE POLICIES
-- Regular user policies
CREATE POLICY "applications_select" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "applications_insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_update" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "applications_delete" ON public.applications FOR DELETE USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "admin_applications_select" ON public.applications FOR SELECT USING (public.is_admin());

-- Profile policies
CREATE POLICY "profile_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin_profile_select" ON public.profiles FOR SELECT USING (public.is_admin());

-- 8. RECREATE ALL THE VIEWS
-- (Restoring the analytics views)

create or replace view public.admin_user_activity as
select
  p.id as user_id,
  p.full_name,
  u.email,
  p.university,
  p.major,
  p.role,
  p.login_count,
  p.last_login_at,
  p.created_at as joined_at,
  count(a.id)::int as application_count
from public.profiles p
left join auth.users u on u.id = p.id
left join public.applications a on a.user_id = p.id
group by p.id, p.full_name, u.email, p.university, p.major, p.role,
         p.login_count, p.last_login_at, p.created_at;

create or replace view public.admin_company_distribution as
select
  company_name,
  count(distinct user_id)::int as student_count,
  count(*)::int as application_count
from public.applications
group by company_name;

create or replace view public.admin_status_distribution as
select
  status,
  count(*)::int as count,
  round(
    count(*)::numeric / nullif((select count(*) from public.applications), 0) * 100,
    1
  ) as percentage
from public.applications
group by status;

create or replace view public.admin_pipeline_funnel as
select
  'Applied' as stage,
  1 as stage_order,
  count(*) filter (where status in ('Applied','Phone Screen','Interview','Technical','Offer','Rejected','Withdrawn','Ghosted'))::int as count
from public.applications
union all
select
  'Screening' as stage,
  2 as stage_order,
  count(*) filter (where status in ('Phone Screen','Interview','Technical','Offer'))::int as count
from public.applications
union all
select
  'Interview' as stage,
  3 as stage_order,
  count(*) filter (where status in ('Interview','Technical','Offer'))::int as count
from public.applications
union all
select
  'Offer' as stage,
  4 as stage_order,
  count(*) filter (where status = 'Offer')::int as count
from public.applications;

create or replace view public.admin_monthly_trends as
select
  to_char(applied_date, 'YYYY-MM') as month,
  count(*)::int as application_count,
  count(distinct user_id)::int as active_users
from public.applications
where applied_date >= current_date - interval '12 months'
group by to_char(applied_date, 'YYYY-MM');

create or replace view public.admin_recent_applications as
select
  a.id,
  a.company_name,
  a.job_title,
  a.status,
  a.applied_date,
  a.created_at,
  p.full_name as applicant_name,
  u.email as applicant_email
from public.applications a
join public.profiles p on p.id = a.user_id
join auth.users u on u.id = a.user_id;

-- ============================================
-- DONE! RUN THIS COMPLETE SCRIPT IN SUPABASE
-- ============================================

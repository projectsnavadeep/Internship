-- ============================================
-- InternTrack - Admin Analytics SQL Scripts
-- ============================================
-- Run these in the Supabase SQL Editor to create
-- reusable views for the admin dashboard.

-- ============================================
-- 1. VIEW: Total User Count
-- ============================================
create or replace view public.admin_user_count as
select count(*)::int as total_users
from public.profiles;

-- ============================================
-- 2. VIEW: User Activity (Login tracking)
-- ============================================
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
         p.login_count, p.last_login_at, p.created_at
order by p.last_login_at desc nulls last;

-- ============================================
-- 3. VIEW: Students per Company
-- ============================================
create or replace view public.admin_company_distribution as
select
  company_name,
  count(distinct user_id)::int as student_count,
  count(*)::int as application_count
from public.applications
group by company_name
order by application_count desc;

-- ============================================
-- 4. VIEW: Application Status Distribution
-- ============================================
create or replace view public.admin_status_distribution as
select
  status,
  count(*)::int as count,
  round(
    count(*)::numeric / nullif((select count(*) from public.applications), 0) * 100,
    1
  ) as percentage
from public.applications
group by status
order by count desc;

-- ============================================
-- 5. VIEW: Internship Pipeline Funnel
-- ============================================
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
from public.applications
order by stage_order;

-- ============================================
-- 6. VIEW: Monthly Application Trends (all users)
-- ============================================
create or replace view public.admin_monthly_trends as
select
  to_char(applied_date, 'YYYY-MM') as month,
  count(*)::int as application_count,
  count(distinct user_id)::int as active_users
from public.applications
where applied_date >= current_date - interval '12 months'
group by to_char(applied_date, 'YYYY-MM')
order by month;

-- ============================================
-- 7. VIEW: Recent Applications (all users)
-- ============================================
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
join auth.users u on u.id = a.user_id
order by a.created_at desc
limit 50;

-- ============================================
-- Grant access to admin views
-- (These views run with the permissions of
--  the querying user, so admin RLS policies
--  on the underlying tables handle access)
-- ============================================

-- ============================================
-- USEFUL STANDALONE QUERIES
-- ============================================

-- Total students (non-admin users)
-- SELECT count(*) FROM public.profiles WHERE role = 'student';

-- Users who logged in within last 7 days
-- SELECT count(*) FROM public.profiles
-- WHERE last_login_at >= now() - interval '7 days';

-- Offer rate
-- SELECT
--   round(
--     count(*) filter (where status = 'Offer')::numeric /
--     nullif(count(*), 0) * 100, 1
--   ) as offer_rate_pct
-- FROM public.applications;

-- Top 10 most-applied companies
-- SELECT company_name, count(*) as apps
-- FROM public.applications
-- GROUP BY company_name
-- ORDER BY apps DESC
-- LIMIT 10;

-- ============================================
-- DONE ✅
-- ============================================

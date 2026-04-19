-- ============================================
-- InternTrack - Clean Supabase Schema (Idempotent / Error-Free)
-- ============================================

-- ============================================
-- 0. ADMIN HELPER FUNCTION
-- ============================================
-- This security definer function avoids infinite recursion 
-- when checking if a user is an admin in RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================
-- 1. PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  university text,
  major text,
  graduation_year integer,
  role text not null default 'student' check (role in ('student', 'admin')),
  login_count integer not null default 0,
  last_login_at timestamptz,
  preferences jsonb default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Policies
drop policy if exists "profile_select" on public.profiles;
create policy "profile_select" on public.profiles for select using (auth.uid() = id);

drop policy if exists "admin_profile_select" on public.profiles;
create policy "admin_profile_select" on public.profiles for select
using (public.is_admin());

drop policy if exists "profile_insert" on public.profiles;
create policy "profile_insert" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profile_update" on public.profiles;
create policy "profile_update" on public.profiles for update using (auth.uid() = id);

-- ============================================
-- 2. APPLICATIONS
-- ============================================
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,

  company_name text not null,
  job_title text not null,
  job_description text,
  job_url text,
  location text,
  salary_range text,

  employment_type text check (employment_type in ('Full-time','Part-time','Contract','Internship','Freelance')),
  status text default 'Applied' not null check (status in ('Applied','Phone Screen','Interview','Technical','Offer','Rejected','Withdrawn','Ghosted')),

  applied_date date default current_date,
  deadline_date date,
  interview_date timestamptz,

  recruiter_name text,
  recruiter_email text,
  recruiter_phone text,

  resume_url text,
  cover_letter_url text,

  notes text,
  rating int check (rating between 1 and 5),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.applications enable row level security;

drop policy if exists "applications_select" on public.applications;
create policy "applications_select" on public.applications for select using (auth.uid() = user_id);

drop policy if exists "admin_applications_select" on public.applications;
create policy "admin_applications_select" on public.applications for select
using (public.is_admin());

drop policy if exists "applications_insert" on public.applications;
create policy "applications_insert" on public.applications for insert with check (auth.uid() = user_id);

drop policy if exists "applications_update" on public.applications;
create policy "applications_update" on public.applications for update using (auth.uid() = user_id);

drop policy if exists "applications_delete" on public.applications;
create policy "applications_delete" on public.applications for delete using (auth.uid() = user_id);

-- ============================================
-- 3. INTERVIEW NOTES
-- ============================================
create table if not exists public.interview_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications on delete cascade,
  user_id uuid references auth.users on delete cascade,

  round_number int default 1,
  round_name text not null,
  interview_type text check (interview_type in ('Phone','Video','In-person','Technical','Behavioral','Panel','Group','Case Study')),

  scheduled_date timestamptz,
  duration_minutes int,

  questions_asked text,
  answers_given text,
  key_takeaways text,
  follow_up_items text,

  outcome text check (outcome in ('Pending','Passed','Failed','No-show','Rescheduled')),

  interviewer_name text,
  interviewer_role text,
  interviewer_email text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.interview_notes enable row level security;

drop policy if exists "notes_select" on public.interview_notes;
create policy "notes_select" on public.interview_notes for select using (auth.uid() = user_id);

drop policy if exists "admin_notes_select" on public.interview_notes;
create policy "admin_notes_select" on public.interview_notes for select
using (public.is_admin());

drop policy if exists "notes_insert" on public.interview_notes;
create policy "notes_insert" on public.interview_notes for insert with check (auth.uid() = user_id);

drop policy if exists "notes_update" on public.interview_notes;
create policy "notes_update" on public.interview_notes for update using (auth.uid() = user_id);

drop policy if exists "notes_delete" on public.interview_notes;
create policy "notes_delete" on public.interview_notes for delete using (auth.uid() = user_id);

-- ============================================
-- 4. REMINDERS
-- ============================================
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  application_id uuid references public.applications on delete cascade,

  title text not null,
  description text,
  reminder_date timestamptz not null,

  reminder_type text not null check (reminder_type in ('Deadline','Interview','Follow-up','Custom')),

  is_completed boolean default false,
  is_notified boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.reminders enable row level security;

drop policy if exists "reminders_select" on public.reminders;
create policy "reminders_select" on public.reminders for select using (auth.uid() = user_id);

drop policy if exists "admin_reminders_select" on public.reminders;
create policy "admin_reminders_select" on public.reminders for select
using (public.is_admin());

drop policy if exists "reminders_insert" on public.reminders;
create policy "reminders_insert" on public.reminders for insert with check (auth.uid() = user_id);

drop policy if exists "reminders_update" on public.reminders;
create policy "reminders_update" on public.reminders for update using (auth.uid() = user_id);

drop policy if exists "reminders_delete" on public.reminders;
create policy "reminders_delete" on public.reminders for delete using (auth.uid() = user_id);

-- ============================================
-- 5. DOCUMENTS
-- ============================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  application_id uuid references public.applications on delete set null,

  name text not null,

  document_type text not null check (document_type in ('Resume','Cover Letter','Transcript','Portfolio','Certificate','Other')),

  file_url text not null,
  file_size int,
  mime_type text,

  is_default boolean default false,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents for select using (auth.uid() = user_id);

drop policy if exists "admin_documents_select" on public.documents;
create policy "admin_documents_select" on public.documents for select
using (public.is_admin());

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents for insert with check (auth.uid() = user_id);

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents for update using (auth.uid() = user_id);

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents for delete using (auth.uid() = user_id);

-- ============================================
-- 6. INDEXES
-- ============================================
create index if not exists idx_app_user on public.applications(user_id);
create index if not exists idx_app_status on public.applications(status);
create index if not exists idx_notes_app on public.interview_notes(application_id);
create index if not exists idx_reminders_user_date on public.reminders(user_id, reminder_date);
create index if not exists idx_profiles_role on public.profiles(role);

-- ============================================
-- 7. AUTO updated_at FUNCTION
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists t_profiles on public.profiles;
create trigger t_profiles before update on public.profiles
for each row execute function update_updated_at();

drop trigger if exists t_applications on public.applications;
create trigger t_applications before update on public.applications
for each row execute function update_updated_at();

drop trigger if exists t_notes on public.interview_notes;
create trigger t_notes before update on public.interview_notes
for each row execute function update_updated_at();

drop trigger if exists t_reminders on public.reminders;
create trigger t_reminders before update on public.reminders
for each row execute function update_updated_at();

-- ============================================
-- 8. AUTO user_id FUNCTION
-- ============================================
create or replace function set_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql;

drop trigger if exists t_app_user on public.applications;
create trigger t_app_user before insert on public.applications
for each row execute function set_user_id();

drop trigger if exists t_notes_user on public.interview_notes;
create trigger t_notes_user before insert on public.interview_notes
for each row execute function set_user_id();

drop trigger if exists t_reminders_user on public.reminders;
create trigger t_reminders_user before insert on public.reminders
for each row execute function set_user_id();

drop trigger if exists t_docs_user on public.documents;
create trigger t_docs_user before insert on public.documents
for each row execute function set_user_id();

-- ============================================
-- DONE ✅
-- ============================================
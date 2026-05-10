-- ============================================
-- 01_users.sql 
-- Handles Users, Profiles, and Auth triggers.
-- ============================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  university text,
  major text,
  graduation_year integer,
  dob date,
  merit text,
  additional_data text,
  signup_date date DEFAULT current_date,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  login_count integer NOT NULL DEFAULT 0,
  last_login_at timestamptz,
  preferences jsonb DEFAULT '{"emailNotifications": true, "theme": "light"}'::jsonb,
  welcome_email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Data Migration from legacy (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_profiles') THEN
        INSERT INTO public.profiles (
            id, full_name, avatar_url, university, major, graduation_year, 
            dob, merit, additional_data, signup_date, role, login_count, 
            last_login_at, preferences, welcome_email_sent, created_at, updated_at
        )
        SELECT 
            id, full_name, avatar_url, university, major, graduation_year, 
            dob, merit, additional_data, signup_date, role, login_count, 
            last_login_at, preferences, welcome_email_sent, created_at, updated_at
        FROM public.legacy_profiles
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

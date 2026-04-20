-- ============================================
-- 04_calendar.sql
-- Reminders and Scheduling system.
-- ============================================

-- 1. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  reminder_date timestamptz NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('Deadline', 'Interview', 'Follow-up', 'Custom')),
  is_completed boolean DEFAULT false,
  is_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Data Migration
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_reminders') THEN
        INSERT INTO public.reminders (id, user_id, application_id, title, reminder_date, reminder_type, is_completed, created_at, updated_at)
        SELECT id, user_id, application_id, title, reminder_date, reminder_type, is_completed, created_at, updated_at
        FROM public.legacy_reminders
        WHERE user_id IN (SELECT id FROM public.profiles)
        AND (application_id IS NULL OR application_id IN (SELECT id FROM public.applications))
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own reminders" 
  ON public.reminders FOR ALL USING (auth.uid() = user_id);

-- Admin Global View
CREATE POLICY "Admins can view all reminders" 
  ON public.reminders FOR SELECT USING (public.is_admin());

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON public.reminders(reminder_date);

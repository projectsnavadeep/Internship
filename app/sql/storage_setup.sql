-- ============================================
-- InternTrack - Supabase Storage Setup (Idempotent)
-- ============================================
-- Execute this script in your Supabase SQL Editor
-- This configures the storage buckets for Avatars and Documents

-- 1. Create Storage Buckets (if they don't exist)
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('documents', 'documents', true)
on conflict (id) do nothing;

-- 2. Avatars Bucket Policies
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Users can upload their own avatar." on storage.objects;
create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( 
    bucket_id = 'avatars' and 
    auth.role() = 'authenticated'
  );

drop policy if exists "Users can update their own avatar." on storage.objects;
create policy "Users can update their own avatar."
  on storage.objects for update
  using ( 
    bucket_id = 'avatars' and 
    auth.role() = 'authenticated'
  );

drop policy if exists "Users can delete their own avatar." on storage.objects;
create policy "Users can delete their own avatar."
  on storage.objects for delete
  using ( 
    bucket_id = 'avatars' and 
    auth.role() = 'authenticated'
  );

-- 3. Documents Bucket Policies
drop policy if exists "Users can view their own documents." on storage.objects;
create policy "Users can view their own documents."
  on storage.objects for select
  using ( 
    bucket_id = 'documents' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own documents." on storage.objects;
create policy "Users can upload their own documents."
  on storage.objects for insert
  with check ( 
    bucket_id = 'documents' and 
    auth.role() = 'authenticated' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own documents." on storage.objects;
create policy "Users can update their own documents."
  on storage.objects for update
  using ( 
    bucket_id = 'documents' and 
    auth.role() = 'authenticated' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own documents." on storage.objects;
create policy "Users can delete their own documents."
  on storage.objects for delete
  using ( 
    bucket_id = 'documents' and 
    auth.role() = 'authenticated' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

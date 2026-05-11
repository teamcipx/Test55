-- Instruction to run in Supabase SQL Editor
-- Create Messages table for Support 
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  is_admin boolean default false,
  content text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Realtime for admin & users
alter table public.messages replica identity full;

-- Create Settings table for storing multiple ImgBB keys
create table public.settings (
  id text primary key,
  value jsonb
);

-- If you are missing the is_admin or is_approved columns in your profiles table, run these first:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- How to set an Admin user manually (run this with your email):
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE id = (SELECT id FROM auth.users WHERE email = 'your_email@example.com');
-- OR using username:
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE username = 'your_username';


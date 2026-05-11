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

-- How to set an Admin user manually (run this with your email):
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your_email@example.com';
-- OR
-- UPDATE public.profiles SET is_admin = true WHERE username = 'your_username';


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

-- Posts / Threads Table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  author_id uuid references public.profiles(id),
  type text not null check (type in ('post', 'thread', 'reply')),
  thread_id uuid references public.posts(id),
  title text,
  content text,
  image_url text,
  likes_count int default 0,
  replies_count int default 0,
  shares_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Likes Table
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) not null,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- RPC for incrementing replies count
create or replace function increment_replies_count(row_id uuid)
returns void as $$
begin
  update public.posts
  set replies_count = replies_count + 1
  where id = row_id;
end;
$$ language plpgsql;

-- If you are missing the is_admin or is_approved columns in your profiles table, run these first:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- How to set an Admin user manually (run this with your email):
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE id = (SELECT id FROM auth.users WHERE email = 'your_email@example.com');
-- OR using username:
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE username = 'your_username';
-- Complete Supabase Schema Setup

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  real_name text,
  display_name text,
  username text unique,
  avatar_url text,
  phone text,
  telegram_or_fb text,
  country text,
  interest text,
  age int,
  is_admin boolean default false,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure admin and approved columns exist (just in case the table already existed)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- 2. Messages Table for Support 
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  is_admin boolean default false,
  content text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Realtime for admin & users
alter table public.messages replica identity full;

-- 3. Settings Table for storing multiple ImgBB keys
create table if not exists public.settings (
  id text primary key,
  value jsonb
);

-- 4. Posts / Threads Table
create table if not exists public.posts (
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

-- 5. Likes Table
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) not null,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- 6. RPC Functions
create or replace function increment_replies_count(row_id uuid)
returns void as $$
begin
  update public.posts
  set replies_count = replies_count + 1
  where id = row_id;
end;
$$ language plpgsql;

-- ============================================================================
-- How to set an Admin user manually (run this in Supabase SQL Editor):
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE id = (SELECT id FROM auth.users WHERE email = 'your_email@example.com');
-- OR using username:
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE username = 'your_username';
-- ============================================================================
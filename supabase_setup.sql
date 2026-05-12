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
  relationship_status text,
  age int,
  is_admin boolean default false,
  is_approved boolean default false,
  is_premium boolean default false,
  is_verified boolean default false,
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure admin and approved columns exist (just in case the table already existed)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_moderator boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- 1A. Blocks Table
create table if not exists public.blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references public.profiles(id) not null,
  blocked_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(blocker_id, blocked_id)
);

-- 1B. Reports Table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) not null,
  reported_id uuid references public.profiles(id) not null,
  reason text not null,
  status text default 'pending', -- pending, reviewed, resolved
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1C. Stories Table
create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  image_url text,
  text_content text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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

-- Ensure new columns exist for posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count int DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS replies_count int DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares_count int DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.posts(id);

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

create or replace function delete_post_with_relations(post_id_to_delete uuid)
returns void as $$
begin
  -- Delete likes of the post itself
  delete from public.likes where post_id = post_id_to_delete;
  
  -- Delete likes of replies if it's a thread
  delete from public.likes where post_id in (select id from public.posts where thread_id = post_id_to_delete);
  
  -- Delete replies
  delete from public.posts where thread_id = post_id_to_delete;
  
  -- Delete the post itself
  delete from public.posts where id = post_id_to_delete;
end;
$$ language plpgsql;

-- 7. Contact Messages Table
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text,
  subject text,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Direct Messages Table
create table if not exists public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  content text,
  image_url text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS content text;


-- 9. Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  actor_id uuid references public.profiles(id),
  type text not null, -- 'message', 'like', 'reply'
  reference_id uuid,
  content text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to create notification on new direct message
create or replace function on_new_direct_message()
returns trigger as $$
begin
  insert into public.notifications (user_id, actor_id, type, reference_id, content)
  values (new.receiver_id, new.sender_id, 'message', new.id, 'Sent you a direct message');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_new_direct_message on public.direct_messages;
create trigger trigger_new_direct_message
  after insert on public.direct_messages
  for each row execute function on_new_direct_message();

-- 10. Premium Requests Table
create table if not exists public.premium_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  binance_pay_id text,
  transaction_id text,
  status text default 'pending', -- pending, approved, rejected
  amount numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Profile Comments & Likes Tables
create table if not exists public.profile_comments (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) not null,
  author_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.profile_likes (
  profile_id uuid references public.profiles(id) not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (profile_id, user_id)
);

alter table public.profile_comments enable row level security;
alter table public.profile_likes enable row level security;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_comments' AND policyname = 'Anyone can read profile comments'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can read profile comments" ON public.profile_comments FOR SELECT USING (true)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_comments' AND policyname = 'Authenticated users can insert profile comments'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can insert profile comments" ON public.profile_comments FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_comments' AND policyname = 'Users can delete their own profile comments'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can delete their own profile comments" ON public.profile_comments FOR DELETE USING (auth.uid() = author_id)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_likes' AND policyname = 'Anyone can read profile likes'
    ) THEN
        EXECUTE 'CREATE POLICY "Anyone can read profile likes" ON public.profile_likes FOR SELECT USING (true)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_likes' AND policyname = 'Authenticated users can manage profile likes'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can manage profile likes" ON public.profile_likes FOR ALL USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- ============================================================================
-- How to set an Admin user manually (run this in Supabase SQL Editor):
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE id = (SELECT id FROM auth.users WHERE email = 'your_email@example.com');
-- OR using username:
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE username = 'your_username';
-- ============================================================================
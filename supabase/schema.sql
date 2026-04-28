-- =============================================================================
-- Core English — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- =============================================================================

-- 1. profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  tier text check (tier in ('book', 'ai_only')) default 'ai_only',
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- 2. access_codes
create table if not exists public.access_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  tier text check (tier in ('book', 'ai_only')) not null,
  used boolean default false,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- 3. usage_limits
create table if not exists public.usage_limits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  chat_messages_used integer default 0,
  ielts_tests_used integer default 0,
  period_start date default current_date,
  bonus_messages integer default 0,
  bonus_ielts integer default 0,
  updated_at timestamptz default now()
);

-- 4. progress
create table if not exists public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  level text not null,
  completed_lessons jsonb default '[]'::jsonb,
  quiz_passed boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, level)
);

-- 5. test_history
create table if not exists public.test_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('quiz', 'ielts')) not null,
  level text,
  score numeric,
  passed boolean,
  overall_band numeric,
  listening_score numeric,
  reading_score numeric,
  writing_band numeric,
  speaking_band numeric,
  feedback text,
  wrong_answers jsonb,
  created_at timestamptz default now()
);

-- 6. certificates
create table if not exists public.certificates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  level text not null,
  score numeric not null,
  issued_at timestamptz default now(),
  unique(user_id, level)
);

-- 7. mistakes
create table if not exists public.mistakes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  level text not null,
  wrong text not null,
  correct text not null,
  explanation text,
  created_at timestamptz default now()
);

-- 8. streak
create table if not exists public.streak (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity date
);

-- 9. conversation_history
create table if not exists public.conversation_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  session_id uuid not null,
  created_at timestamptz default now()
);

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles             enable row level security;
alter table public.access_codes         enable row level security;
alter table public.usage_limits         enable row level security;
alter table public.progress             enable row level security;
alter table public.test_history         enable row level security;
alter table public.certificates         enable row level security;
alter table public.mistakes             enable row level security;
alter table public.streak               enable row level security;
alter table public.conversation_history enable row level security;

-- profiles: own row only (id = auth.uid())
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- access_codes: users can read their own redemption rows; redeem (update) handled by service role.
drop policy if exists "access_codes_select_own" on public.access_codes;
create policy "access_codes_select_own" on public.access_codes
  for select using (auth.uid() = used_by);

-- Own-row policies for all user-owned tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'usage_limits',
    'progress',
    'test_history',
    'certificates',
    'mistakes',
    'streak',
    'conversation_history'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      t || '_select_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      t || '_insert_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id)',
      t || '_update_own', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      t || '_delete_own', t
    );
  end loop;
end $$;

-- =============================================================================
-- Auto-provision rows for new users
-- =============================================================================

-- New auth.users row -> profiles row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- New profiles row -> usage_limits + streak rows
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usage_limits (user_id) values (new.id)
    on conflict (user_id) do nothing;

  insert into public.streak (user_id) values (new.id)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

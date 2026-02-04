-- Extensions
create extension if not exists "pgcrypto";

-- ENUMS
do $$ begin
  create type account_role as enum ('owner', 'demo', 'user');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type application_status as enum (
    'draft',
    'applied',
    'screening',
    'interview',
    'offer',
    'rejected',
    'hired'
  );
exception when duplicate_object then null;
end $$;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- USERS
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role account_role not null default 'user',
  email text not null unique,

  first_name text,
  last_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- APPLICATIONS
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  company text not null,
  title text not null,
  location text,
  job_url text,

  status application_status not null default 'draft',
  applied_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_applications_user_id on public.applications(user_id);

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- STAGES
create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  type application_status not null,
  label text,
  occurred_at timestamptz,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stages_user_id on public.stages(user_id);
create index if not exists idx_stages_application_id on public.stages(application_id);

drop trigger if exists trg_stages_updated_at on public.stages;
create trigger trg_stages_updated_at
before update on public.stages
for each row execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.applications enable row level security;
alter table public.stages enable row level security;

-- USERS policies
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users for select
using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users for insert
with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- APPLICATIONS policies
drop policy if exists "applications_crud_own" on public.applications;
create policy "applications_crud_own"
on public.applications for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- STAGES policies
drop policy if exists "stages_crud_own" on public.stages;
create policy "stages_crud_own"
on public.stages for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Auto-create public.users row when auth user is created (first_name, last_name from raw_user_meta_data)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, role, first_name, last_name)
  values (
    new.id,
    new.email,
    'user',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

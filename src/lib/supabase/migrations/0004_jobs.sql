create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  fingerprint text not null,

  title text not null,
  company text not null,
  location text null,

  source text not null,
  source_url text not null,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  scraped_at timestamptz null,
  raw jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint jobs_user_fingerprint_unique unique (user_id, fingerprint)
);

create index if not exists jobs_user_last_seen_idx on public.jobs (user_id, last_seen_at desc);
create index if not exists jobs_user_company_idx on public.jobs (user_id, company);
create index if not exists jobs_user_source_idx on public.jobs (user_id, source);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;

drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own"
on public.jobs for select
using (auth.uid() = user_id);

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own"
on public.jobs for insert
with check (auth.uid() = user_id);

drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own"
on public.jobs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
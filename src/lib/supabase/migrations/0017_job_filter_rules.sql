create table if not exists public.job_filter_rules (
  user_id uuid primary key references auth.users(id) on delete cascade,
  include_keywords text[] not null default '{}',
  exclude_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_filter_rules enable row level security;

drop policy if exists "job_filter_rules_select_own" on public.job_filter_rules;
create policy "job_filter_rules_select_own"
on public.job_filter_rules for select
using (auth.uid() = user_id);

drop policy if exists "job_filter_rules_insert_own" on public.job_filter_rules;
create policy "job_filter_rules_insert_own"
on public.job_filter_rules for insert
with check (auth.uid() = user_id);

drop policy if exists "job_filter_rules_update_own" on public.job_filter_rules;
create policy "job_filter_rules_update_own"
on public.job_filter_rules for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists set_job_filter_rules_updated_at on public.job_filter_rules;
create trigger set_job_filter_rules_updated_at
before update on public.job_filter_rules
for each row execute function public.set_updated_at();

alter table public.jobs add column if not exists auto_dismissed_at timestamptz null;
alter table public.jobs add column if not exists auto_dismissed_reason text null;

create index if not exists jobs_user_auto_dismissed_idx
  on public.jobs (user_id, auto_dismissed_at desc)
  where auto_dismissed_at is not null;

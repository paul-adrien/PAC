create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  type text not null,
  prompt text not null,
  result text not null,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_created_idx
on public.generations (user_id, created_at desc);

create index if not exists generations_user_job_type_idx
on public.generations (user_id, job_id, type);

alter table public.generations enable row level security;

create policy "generations_select_own"
on public.generations for select
using (auth.uid() = user_id);

create policy "generations_insert_own"
on public.generations for insert
with check (auth.uid() = user_id);

create policy "generations_delete_own"
on public.generations for delete
using (auth.uid() = user_id);

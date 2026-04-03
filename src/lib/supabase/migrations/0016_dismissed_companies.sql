create table if not exists public.dismissed_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  created_at timestamptz not null default now(),
  unique (user_id, company)
);

alter table public.dismissed_companies enable row level security;

create policy "Users can manage their own dismissed companies"
  on public.dismissed_companies
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

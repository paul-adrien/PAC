create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

alter table public.prompts enable row level security;

create policy "prompts_select_own"
on public.prompts for select
using (auth.uid() = user_id);

create policy "prompts_insert_own"
on public.prompts for insert
with check (auth.uid() = user_id);

create policy "prompts_update_own"
on public.prompts for update
using (auth.uid() = user_id);

create policy "prompts_delete_own"
on public.prompts for delete
using (auth.uid() = user_id);

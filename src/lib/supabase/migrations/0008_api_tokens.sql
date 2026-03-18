create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  label text not null default 'Extension Chrome',
  created_at timestamptz not null default now(),
  last_used_at timestamptz null
);

create index if not exists api_tokens_token_idx on public.api_tokens (token);

alter table public.api_tokens enable row level security;

create policy "api_tokens_select_own"
on public.api_tokens for select
using (auth.uid() = user_id);

create policy "api_tokens_insert_own"
on public.api_tokens for insert
with check (auth.uid() = user_id);

create policy "api_tokens_delete_own"
on public.api_tokens for delete
using (auth.uid() = user_id);

create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'claude',
  encrypted_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.user_api_keys enable row level security;

create policy "user_api_keys_select_own"
on public.user_api_keys for select
using (auth.uid() = user_id);

create policy "user_api_keys_insert_own"
on public.user_api_keys for insert
with check (auth.uid() = user_id);

create policy "user_api_keys_update_own"
on public.user_api_keys for update
using (auth.uid() = user_id);

create policy "user_api_keys_delete_own"
on public.user_api_keys for delete
using (auth.uid() = user_id);

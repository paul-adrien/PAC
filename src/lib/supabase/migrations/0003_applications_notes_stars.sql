alter table public.applications
  add column if not exists notes text,
  add column if not exists stars smallint;

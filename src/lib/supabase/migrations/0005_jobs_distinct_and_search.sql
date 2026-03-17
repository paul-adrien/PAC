create or replace function public.jobs_distinct_companies(p_user_id uuid)
returns setof text
language sql stable security definer
as $$
  select distinct company
  from public.jobs
  where user_id = p_user_id
  order by company;
$$;

create or replace function public.jobs_distinct_sources(p_user_id uuid)
returns setof text
language sql stable security definer
as $$
  select distinct source
  from public.jobs
  where user_id = p_user_id
  order by source;
$$;

create extension if not exists pg_trgm;

create index if not exists jobs_title_trgm_idx
  on public.jobs using gin (title gin_trgm_ops);

create index if not exists jobs_company_trgm_idx
  on public.jobs using gin (company gin_trgm_ops);

create index if not exists jobs_location_trgm_idx
  on public.jobs using gin (location gin_trgm_ops);

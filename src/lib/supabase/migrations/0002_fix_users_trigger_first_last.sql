-- Fix: populate public.users.first_name and last_name from auth.users.raw_user_meta_data
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

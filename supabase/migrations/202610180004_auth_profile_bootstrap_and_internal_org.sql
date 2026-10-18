alter table public.organizations
  add column if not exists slug text;

create unique index if not exists organizations_slug_key
  on public.organizations(slug)
  where slug is not null;

insert into public.organizations (
  name,
  slug,
  organization_type,
  website,
  status,
  verification_status,
  verified_at
)
values (
  'CareForVets',
  'careforvets',
  'careforvets',
  'https://careforvets.com',
  'active',
  'verified',
  now()
)
on conflict (slug) where slug is not null do update
set
  name = excluded.name,
  organization_type = excluded.organization_type,
  website = excluded.website,
  status = excluded.status,
  verification_status = excluded.verification_status,
  verified_at = coalesce(public.organizations.verified_at, excluded.verified_at),
  updated_at = now();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_type text;
begin
  requested_type := coalesce(new.raw_user_meta_data ->> 'user_type', 'veteran');

  if requested_type not in ('veteran','employer','partner') then
    requested_type := 'veteran';
  end if;

  insert into public.profiles (
    id,
    display_name,
    email,
    user_type
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    requested_type
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

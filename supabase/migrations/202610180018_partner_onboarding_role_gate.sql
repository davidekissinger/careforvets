-- Require a partner/employer profile for external partner onboarding.
-- Keep the authorization check in the database rather than relying only on UI navigation.

create or replace function public.start_partner_onboarding(
  org_name text,
  org_website text default null,
  org_phone text default null,
  org_service_area text[] default '{}'::text[],
  requested_partner_kind text default 'resource_referral',
  requested_compensation boolean default false,
  requested_referral_method text default null,
  requested_eligibility_summary text default null,
  requested_accepts_referrals boolean default false,
  requested_outcome_updates boolean default false,
  requested_service_slugs text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  caller_type text;
begin
  select p.user_type into caller_type
  from public.profiles p
  where p.id = (select auth.uid());

  if caller_type not in ('partner','employer') then
    raise exception 'partner or employer account required for external partner onboarding';
  end if;

  return private.start_partner_onboarding(
    org_name, org_website, org_phone, org_service_area,
    requested_partner_kind, requested_compensation,
    requested_referral_method, requested_eligibility_summary,
    requested_accepts_referrals, requested_outcome_updates, requested_service_slugs
  );
end;
$$;

revoke all on function public.start_partner_onboarding(text,text,text,text[],text,boolean,text,text,boolean,boolean,text[]) from public;
grant execute on function public.start_partner_onboarding(text,text,text,text[],text,boolean,text,text,boolean,boolean,text[]) to authenticated;

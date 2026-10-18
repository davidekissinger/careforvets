-- Prevent partner activation if the operational profile is incomplete.
create or replace function private.prevent_incomplete_partner_approval()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  org_row public.organizations%rowtype;
  partner_row public.partner_profiles%rowtype;
begin
  if new.verification_status = 'approved' or new.final_review_status = 'approved' then
    select * into org_row from public.organizations where id = new.organization_id;
    select * into partner_row from public.partner_profiles where organization_id = new.organization_id;

    if not found then raise exception 'partner profile required before approval'; end if;
    if cardinality(coalesce(org_row.service_area, '{}'::text[])) = 0 then
      raise exception 'service area must be configured before approval';
    end if;
    if not exists (
      select 1 from public.partner_services ps
      join public.service_categories sc on sc.id = ps.service_category_id
      where ps.partner_organization_id = new.organization_id and sc.active = true
    ) then raise exception 'at least one active service category is required before approval'; end if;
    if nullif(trim(partner_row.referral_method), '') is null then
      raise exception 'referral method must be configured before approval';
    end if;
    if nullif(trim(partner_row.eligibility_summary), '') is null then
      raise exception 'eligibility summary must be configured before approval';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_incomplete_partner_approval() from public;
revoke all on function private.prevent_incomplete_partner_approval() from anon;
revoke all on function private.prevent_incomplete_partner_approval() from authenticated;

drop trigger if exists prevent_incomplete_partner_approval on public.partner_verification_cases;
create trigger prevent_incomplete_partner_approval
before insert or update of verification_status, final_review_status
on public.partner_verification_cases
for each row execute function private.prevent_incomplete_partner_approval();

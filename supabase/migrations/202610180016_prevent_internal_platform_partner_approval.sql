-- Prevent CareForVets' own internal platform/brand record from being approved
-- through the external partner-verification workflow.

create or replace function private.prevent_internal_platform_partner_approval()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  target_org_name text;
  target_org_type text;
begin
  if new.verification_status = 'approved'
     or new.final_review_status = 'approved' then
    select o.name, o.organization_type
      into target_org_name, target_org_type
    from public.organizations o
    where o.id = new.organization_id;

    if target_org_type = 'careforvets'
       or lower(trim(coalesce(target_org_name, ''))) = 'careforvets' then
      raise exception 'CareForVets internal platform/brand record cannot be approved as an external partner';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_internal_platform_partner_approval() from public;
revoke all on function private.prevent_internal_platform_partner_approval() from anon;
revoke all on function private.prevent_internal_platform_partner_approval() from authenticated;

drop trigger if exists prevent_internal_platform_partner_approval
  on public.partner_verification_cases;

create trigger prevent_internal_platform_partner_approval
before insert or update of verification_status, final_review_status
on public.partner_verification_cases
for each row
execute function private.prevent_internal_platform_partner_approval();

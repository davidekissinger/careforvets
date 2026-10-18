create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function private.current_user_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = auth.uid()
      and m.status = 'active'
      and o.organization_type = 'careforvets'
      and o.status = 'active'
      and m.role in ('owner','admin','staff','recruiter')
  );
$$;

revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.current_user_is_staff() from public;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.current_user_is_staff() to authenticated;

alter policy profiles_self_select on public.profiles
using (id = auth.uid() or private.current_user_is_staff());
alter policy profiles_self_update on public.profiles
using (id = auth.uid() or private.current_user_is_staff())
with check (id = auth.uid() or private.current_user_is_staff());

alter policy orgs_member_read on public.organizations
using (private.is_org_member(id) or private.current_user_is_staff());
alter policy orgs_staff_manage on public.organizations
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy memberships_self_read on public.organization_memberships
using (user_id = auth.uid() or private.current_user_is_staff());
alter policy memberships_staff_manage on public.organization_memberships
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy occupations_staff_manage on public.occupations
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy candidate_self_read on public.candidate_profiles
using (user_id = auth.uid() or private.current_user_is_staff());
alter policy candidate_self_update on public.candidate_profiles
using (user_id = auth.uid() or private.current_user_is_staff())
with check (user_id = auth.uid() or private.current_user_is_staff());

alter policy candidate_occ_self_manage on public.candidate_occupations
using (candidate_id = auth.uid() or private.current_user_is_staff())
with check (candidate_id = auth.uid() or private.current_user_is_staff());

alter policy skills_staff_manage on public.skills
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy candidate_skills_self_manage on public.candidate_skills
using (candidate_id = auth.uid() or private.current_user_is_staff())
with check (candidate_id = auth.uid() or private.current_user_is_staff());

alter policy credentials_self_manage on public.credentials
using (candidate_id = auth.uid() or private.current_user_is_staff())
with check (candidate_id = auth.uid() or private.current_user_is_staff());

alter policy jobs_member_read on public.jobs
using (private.is_org_member(organization_id) or private.current_user_is_staff());
alter policy jobs_member_manage on public.jobs
using (private.is_org_member(organization_id) or private.current_user_is_staff())
with check (private.is_org_member(organization_id) or private.current_user_is_staff());

alter policy applications_participant_read on public.applications
using (
  candidate_id = auth.uid()
  or private.current_user_is_staff()
  or exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and private.is_org_member(j.organization_id)
  )
);
alter policy applications_participant_update on public.applications
using (
  candidate_id = auth.uid()
  or private.current_user_is_staff()
  or exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and private.is_org_member(j.organization_id)
  )
);

alter policy partner_member_read on public.partner_profiles
using (private.is_org_member(organization_id) or private.current_user_is_staff());
alter policy partner_staff_manage on public.partner_profiles
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy categories_staff_manage on public.service_categories
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy partner_services_staff_manage on public.partner_services
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy resources_staff_manage on public.resources
using (private.current_user_is_staff())
with check (private.current_user_is_staff());

alter policy consent_self_read on public.consent_records
using (user_id = auth.uid() or private.current_user_is_staff());
alter policy consent_self_update on public.consent_records
using (user_id = auth.uid() or private.current_user_is_staff());

alter policy referrals_participant_read on public.referrals
using (
  veteran_user_id = auth.uid()
  or private.is_org_member(partner_organization_id)
  or private.current_user_is_staff()
);
alter policy referrals_self_insert on public.referrals
with check (
  (veteran_user_id = auth.uid() and created_by = auth.uid())
  or private.current_user_is_staff()
);
alter policy referrals_participant_update on public.referrals
using (
  veteran_user_id = auth.uid()
  or private.is_org_member(partner_organization_id)
  or private.current_user_is_staff()
);

alter policy referral_events_participant_read on public.referral_events
using (
  private.current_user_is_staff()
  or exists (
    select 1
    from public.referrals r
    where r.id = referral_events.referral_id
      and (
        r.veteran_user_id = auth.uid()
        or private.is_org_member(r.partner_organization_id)
      )
  )
);

alter policy audit_staff_read on public.audit_events
using (private.current_user_is_staff());

drop function if exists public.is_org_member(uuid);
drop function if exists public.current_user_is_staff();

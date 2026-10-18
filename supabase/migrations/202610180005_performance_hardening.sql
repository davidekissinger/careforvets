-- Performance hardening for CareForVets BUILD v2

create index if not exists idx_audit_events_actor_user on public.audit_events(actor_user_id);
create index if not exists idx_candidate_occupations_occupation on public.candidate_occupations(occupation_id);
create index if not exists idx_candidate_skills_skill on public.candidate_skills(skill_id);
create index if not exists idx_consent_records_user on public.consent_records(user_id);
create index if not exists idx_credentials_candidate on public.credentials(candidate_id);
create index if not exists idx_jobs_created_by on public.jobs(created_by);
create index if not exists idx_jobs_occupation on public.jobs(occupation_id);
create index if not exists idx_organizations_created_by on public.organizations(created_by);
create index if not exists idx_partner_services_category on public.partner_services(service_category_id);
create index if not exists idx_referral_events_actor on public.referral_events(actor_user_id);
create index if not exists idx_referral_events_referral on public.referral_events(referral_id);
create index if not exists idx_referrals_consent on public.referrals(consent_record_id);
create index if not exists idx_referrals_created_by on public.referrals(created_by);
create index if not exists idx_referrals_service_category on public.referrals(service_category_id);
create index if not exists idx_resources_service_category on public.resources(service_category_id);

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
      and m.user_id = (select auth.uid())
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
    where m.user_id = (select auth.uid())
      and m.status = 'active'
      and o.organization_type = 'careforvets'
      and o.status = 'active'
      and m.role in ('owner','admin','staff','recruiter')
  );
$$;

alter policy profiles_self_select on public.profiles
using (id = (select auth.uid()) or private.current_user_is_staff());
alter policy profiles_self_insert on public.profiles
with check (id = (select auth.uid()));
alter policy profiles_self_update on public.profiles
using (id = (select auth.uid()) or private.current_user_is_staff())
with check (id = (select auth.uid()) or private.current_user_is_staff());

alter policy memberships_self_read on public.organization_memberships
using (user_id = (select auth.uid()) or private.current_user_is_staff());

alter policy candidate_self_read on public.candidate_profiles
using (user_id = (select auth.uid()) or private.current_user_is_staff());
alter policy candidate_self_insert on public.candidate_profiles
with check (user_id = (select auth.uid()));
alter policy candidate_self_update on public.candidate_profiles
using (user_id = (select auth.uid()) or private.current_user_is_staff())
with check (user_id = (select auth.uid()) or private.current_user_is_staff());

alter policy candidate_occ_self_manage on public.candidate_occupations
using (candidate_id = (select auth.uid()) or private.current_user_is_staff())
with check (candidate_id = (select auth.uid()) or private.current_user_is_staff());

alter policy candidate_skills_self_manage on public.candidate_skills
using (candidate_id = (select auth.uid()) or private.current_user_is_staff())
with check (candidate_id = (select auth.uid()) or private.current_user_is_staff());

alter policy credentials_self_manage on public.credentials
using (candidate_id = (select auth.uid()) or private.current_user_is_staff())
with check (candidate_id = (select auth.uid()) or private.current_user_is_staff());

alter policy applications_participant_read on public.applications
using (
  candidate_id = (select auth.uid())
  or private.current_user_is_staff()
  or exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and private.is_org_member(j.organization_id)
  )
);
alter policy applications_candidate_insert on public.applications
with check (candidate_id = (select auth.uid()));
alter policy applications_participant_update on public.applications
using (
  candidate_id = (select auth.uid())
  or private.current_user_is_staff()
  or exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and private.is_org_member(j.organization_id)
  )
);

alter policy consent_self_read on public.consent_records
using (user_id = (select auth.uid()) or private.current_user_is_staff());
alter policy consent_self_insert on public.consent_records
with check (user_id = (select auth.uid()));
alter policy consent_self_update on public.consent_records
using (user_id = (select auth.uid()) or private.current_user_is_staff());

alter policy referrals_participant_read on public.referrals
using (
  veteran_user_id = (select auth.uid())
  or private.is_org_member(partner_organization_id)
  or private.current_user_is_staff()
);
alter policy referrals_self_insert on public.referrals
with check (
  (veteran_user_id = (select auth.uid()) and created_by = (select auth.uid()))
  or private.current_user_is_staff()
);
alter policy referrals_participant_update on public.referrals
using (
  veteran_user_id = (select auth.uid())
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
        r.veteran_user_id = (select auth.uid())
        or private.is_org_member(r.partner_organization_id)
      )
  )
);

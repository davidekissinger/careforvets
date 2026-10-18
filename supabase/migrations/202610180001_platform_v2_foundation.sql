-- CareForVets Platform v2 foundation
-- NON-PHI system. Do not use these tables for diagnoses, medications, assessments,
-- medical records, OASIS, plans of care, or other clinical information.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  phone text,
  user_type text not null default 'veteran' check (user_type in ('veteran','employer','partner','staff')),
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text not null check (organization_type in ('careforvets','employer','partner','provider','other')),
  website text,
  phone text,
  service_area text[],
  status text not null default 'pending' check (status in ('pending','active','inactive','rejected')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','in_review','verified','expired','rejected')),
  verified_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','staff','recruiter','partner_user','employer_user')),
  status text not null default 'active' check (status in ('active','inactive','invited')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.occupations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  veteran_status_attested boolean not null default false,
  career_summary text,
  years_experience smallint check (years_experience is null or years_experience between 0 and 80),
  desired_work_types text[],
  preferred_geographies text[],
  remote_preference text check (remote_preference is null or remote_preference in ('onsite','hybrid','remote','open')),
  availability_date date,
  active_search_status text not null default 'open' check (active_search_status in ('open','passive','not_searching')),
  visibility text not null default 'private' check (visibility in ('private','matched_employers','network')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_occupations (
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  occupation_id uuid not null references public.occupations(id) on delete cascade,
  experience_years numeric(4,1) check (experience_years is null or experience_years between 0 and 80),
  primary_flag boolean not null default false,
  primary key (candidate_id, occupation_id)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default true
);

create table if not exists public.candidate_skills (
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (candidate_id, skill_id)
);

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  credential_type text not null,
  credential_name text not null,
  issuing_body text,
  issuing_state text,
  credential_number text,
  issue_date date,
  expiration_date date,
  verification_status text not null default 'self_reported' check (verification_status in ('self_reported','in_review','verified','expired','rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  occupation_id uuid references public.occupations(id),
  employment_type text,
  location_text text,
  remote_status text check (remote_status is null or remote_status in ('onsite','hybrid','remote')),
  compensation_text text,
  description text not null,
  requirements text,
  status text not null default 'draft' check (status in ('draft','published','paused','closed')),
  published_at timestamptz,
  closes_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','reviewing','interview','offer','hired','declined','withdrawn','closed')),
  source text,
  applied_at timestamptz not null default now(),
  last_status_change_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table if not exists public.partner_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  relationship_status text not null default 'prospect' check (relationship_status in ('prospect','invited','active','paused','ended')),
  referral_method text,
  eligibility_summary text,
  accepts_referrals boolean not null default false,
  outcome_updates_supported boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  active boolean not null default true
);

create table if not exists public.partner_services (
  partner_organization_id uuid not null references public.partner_profiles(organization_id) on delete cascade,
  service_category_id uuid not null references public.service_categories(id) on delete cascade,
  primary key (partner_organization_id, service_category_id)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider_name text,
  service_category_id uuid references public.service_categories(id),
  description text not null,
  website text,
  geography text,
  eligibility_summary text,
  source_url text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','in_review','verified','expired','rejected')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  verified_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  version text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  source text
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  veteran_user_id uuid not null references auth.users(id) on delete cascade,
  partner_organization_id uuid not null references public.organizations(id),
  service_category_id uuid not null references public.service_categories(id),
  consent_record_id uuid references public.consent_records(id),
  status text not null default 'created' check (status in ('created','sent','acknowledged','accepted','engaged','outcome_received','closed','declined','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_memberships_user on public.organization_memberships(user_id);
create index if not exists idx_jobs_org_status on public.jobs(organization_id, status);
create index if not exists idx_applications_candidate on public.applications(candidate_id);
create index if not exists idx_referrals_veteran on public.referrals(veteran_user_id);
create index if not exists idx_referrals_partner on public.referrals(partner_organization_id);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists (
  select 1 from public.organization_memberships m
  where m.organization_id=target_org and m.user_id=auth.uid() and m.status='active'
); $$;

create or replace function public.current_user_is_staff()
returns boolean language sql stable security definer set search_path=public
as $$ select exists (
  select 1 from public.organization_memberships m
  join public.organizations o on o.id=m.organization_id
  where m.user_id=auth.uid() and m.status='active'
    and o.organization_type='careforvets' and o.status='active'
    and m.role in ('owner','admin','staff','recruiter')
); $$;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.current_user_is_staff() to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.occupations enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.candidate_occupations enable row level security;
alter table public.skills enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.credentials enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.partner_services enable row level security;
alter table public.resources enable row level security;
alter table public.consent_records enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_events enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id=auth.uid() or public.current_user_is_staff());
create policy profiles_self_insert on public.profiles for insert to authenticated with check (id=auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id=auth.uid() or public.current_user_is_staff()) with check (id=auth.uid() or public.current_user_is_staff());

create policy orgs_public_verified on public.organizations for select to anon,authenticated using (status='active' and verification_status='verified');
create policy orgs_member_read on public.organizations for select to authenticated using (public.is_org_member(id) or public.current_user_is_staff());
create policy orgs_staff_manage on public.organizations for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());

create policy memberships_self_read on public.organization_memberships for select to authenticated using (user_id=auth.uid() or public.current_user_is_staff());
create policy memberships_staff_manage on public.organization_memberships for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());

create policy occupations_public_read on public.occupations for select to anon,authenticated using (active=true);
create policy occupations_staff_manage on public.occupations for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());

create policy candidate_self_read on public.candidate_profiles for select to authenticated using (user_id=auth.uid() or public.current_user_is_staff());
create policy candidate_self_insert on public.candidate_profiles for insert to authenticated with check (user_id=auth.uid());
create policy candidate_self_update on public.candidate_profiles for update to authenticated using (user_id=auth.uid() or public.current_user_is_staff()) with check (user_id=auth.uid() or public.current_user_is_staff());

create policy candidate_occ_self_manage on public.candidate_occupations for all to authenticated using (candidate_id=auth.uid() or public.current_user_is_staff()) with check (candidate_id=auth.uid() or public.current_user_is_staff());
create policy skills_public_read on public.skills for select to anon,authenticated using (active=true);
create policy skills_staff_manage on public.skills for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());
create policy candidate_skills_self_manage on public.candidate_skills for all to authenticated using (candidate_id=auth.uid() or public.current_user_is_staff()) with check (candidate_id=auth.uid() or public.current_user_is_staff());
create policy credentials_self_manage on public.credentials for all to authenticated using (candidate_id=auth.uid() or public.current_user_is_staff()) with check (candidate_id=auth.uid() or public.current_user_is_staff());

create policy jobs_public_read on public.jobs for select to anon,authenticated using (status='published');
create policy jobs_member_read on public.jobs for select to authenticated using (public.is_org_member(organization_id) or public.current_user_is_staff());
create policy jobs_member_manage on public.jobs for all to authenticated using (public.is_org_member(organization_id) or public.current_user_is_staff()) with check (public.is_org_member(organization_id) or public.current_user_is_staff());

create policy applications_participant_read on public.applications for select to authenticated using (
  candidate_id=auth.uid() or public.current_user_is_staff() or exists (
    select 1 from public.jobs j where j.id=applications.job_id and public.is_org_member(j.organization_id)
  )
);
create policy applications_candidate_insert on public.applications for insert to authenticated with check (candidate_id=auth.uid());
create policy applications_participant_update on public.applications for update to authenticated using (
  candidate_id=auth.uid() or public.current_user_is_staff() or exists (
    select 1 from public.jobs j where j.id=applications.job_id and public.is_org_member(j.organization_id)
  )
);

create policy partner_public_verified on public.partner_profiles for select to anon,authenticated using (
  relationship_status='active' and exists (
    select 1 from public.organizations o where o.id=partner_profiles.organization_id and o.status='active' and o.verification_status='verified'
  )
);
create policy partner_member_read on public.partner_profiles for select to authenticated using (public.is_org_member(organization_id) or public.current_user_is_staff());
create policy partner_staff_manage on public.partner_profiles for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());

create policy categories_public_read on public.service_categories for select to anon,authenticated using (active=true);
create policy categories_staff_manage on public.service_categories for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());
create policy partner_services_public_read on public.partner_services for select to anon,authenticated using (true);
create policy partner_services_staff_manage on public.partner_services for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());

create policy resources_public_read on public.resources for select to anon,authenticated using (publication_status='published');
create policy resources_staff_manage on public.resources for all to authenticated using (public.current_user_is_staff()) with check (public.current_user_is_staff());

create policy consent_self_read on public.consent_records for select to authenticated using (user_id=auth.uid() or public.current_user_is_staff());
create policy consent_self_insert on public.consent_records for insert to authenticated with check (user_id=auth.uid());
create policy consent_self_update on public.consent_records for update to authenticated using (user_id=auth.uid() or public.current_user_is_staff());

create policy referrals_participant_read on public.referrals for select to authenticated using (
  veteran_user_id=auth.uid() or public.is_org_member(partner_organization_id) or public.current_user_is_staff()
);
create policy referrals_self_insert on public.referrals for insert to authenticated with check (
  (veteran_user_id=auth.uid() and created_by=auth.uid()) or public.current_user_is_staff()
);
create policy referrals_participant_update on public.referrals for update to authenticated using (
  veteran_user_id=auth.uid() or public.is_org_member(partner_organization_id) or public.current_user_is_staff()
);

create policy referral_events_participant_read on public.referral_events for select to authenticated using (
  public.current_user_is_staff() or exists (
    select 1 from public.referrals r where r.id=referral_events.referral_id
      and (r.veteran_user_id=auth.uid() or public.is_org_member(r.partner_organization_id))
  )
);

create policy audit_staff_read on public.audit_events for select to authenticated using (public.current_user_is_staff());

insert into storage.buckets (id,name,public) values ('candidate-documents','candidate-documents',false)
on conflict (id) do nothing;

create policy candidate_documents_select_own on storage.objects for select to authenticated
using (bucket_id='candidate-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy candidate_documents_insert_own on storage.objects for insert to authenticated
with check (bucket_id='candidate-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy candidate_documents_update_own on storage.objects for update to authenticated
using (bucket_id='candidate-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy candidate_documents_delete_own on storage.objects for delete to authenticated
using (bucket_id='candidate-documents' and (storage.foldername(name))[1]=auth.uid()::text);

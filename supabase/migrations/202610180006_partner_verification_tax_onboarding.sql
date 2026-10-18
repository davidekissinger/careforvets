-- CareForVets BUILD v2 — automated partner verification and tax onboarding
-- Non-PHI workflow. Real tax documents are sensitive PII and must remain in private storage.
-- Do not copy taxpayer identification numbers into ordinary application tables.

alter table public.partner_profiles
  add column if not exists partner_kind text not null default 'resource_referral'
    check (partner_kind in ('resource_referral','employer','contracted_vendor','independent_contractor','clinical_provider','other')),
  add column if not exists compensation_expected boolean not null default false,
  add column if not exists verification_stage text not null default 'intake'
    check (verification_stage in ('intake','documents','classification_review','agreement','final_review','approved','declined','paused')),
  add column if not exists verification_owner uuid references auth.users(id),
  add column if not exists verification_due_at timestamptz,
  add column if not exists notes text;

create table if not exists public.partner_verification_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  partner_kind text not null
    check (partner_kind in ('resource_referral','employer','contracted_vendor','independent_contractor','clinical_provider','other')),
  compensation_expected boolean not null default false,
  w9_required boolean not null default false,
  w9_status text not null default 'not_required'
    check (w9_status in ('not_required','required','uploaded','under_review','accepted','rejected','needs_update')),
  classification_review_required boolean not null default false,
  classification_status text not null default 'not_applicable'
    check (classification_status in ('not_applicable','not_reviewed','in_review','contractor_supported','employee_risk','legal_review')),
  agreement_required boolean not null default false,
  agreement_status text not null default 'not_required'
    check (agreement_status in ('not_required','required','sent','signed','rejected','needs_update')),
  tax_reporting_status text not null default 'not_applicable'
    check (tax_reporting_status in ('not_applicable','review_required','potential_1099','exempt','reportable','filed')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending','blocked','ready_for_review','approved','declined','paused')),
  risk_level text not null default 'standard'
    check (risk_level in ('standard','elevated','high')),
  assigned_to uuid references auth.users(id),
  next_action text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_case_id uuid not null references public.partner_verification_cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type text not null
    check (document_type in ('w9','contractor_agreement','classification_review','insurance','license','other')),
  storage_path text,
  status text not null default 'requested'
    check (status in ('requested','uploaded','under_review','accepted','rejected','needs_update')),
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  expires_at date,
  reviewer_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_classification_reviews (
  id uuid primary key default gen_random_uuid(),
  verification_case_id uuid not null unique references public.partner_verification_cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  behavioral_control jsonb not null default '{}'::jsonb,
  financial_control jsonb not null default '{}'::jsonb,
  relationship_factors jsonb not null default '{}'::jsonb,
  determination text not null default 'not_reviewed'
    check (determination in ('not_reviewed','contractor_supported','employee_risk','legal_review','not_applicable')),
  rationale text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_reporting_rules (
  tax_year integer primary key,
  nonemployee_compensation_threshold numeric(12,2) not null,
  source_url text not null,
  source_checked_at timestamptz not null default now(),
  notes text
);

insert into public.tax_reporting_rules (
  tax_year, nonemployee_compensation_threshold, source_url, notes
)
values (
  2026,
  2000.00,
  'https://www.irs.gov/businesses/small-businesses-self-employed/am-i-required-to-file-a-form-1099-or-other-information-return',
  'IRS reporting threshold for payments made in 2026. Reporting can still be required below the threshold when backup withholding applies, and entity/payment-specific exceptions may apply.'
)
on conflict (tax_year) do update
set nonemployee_compensation_threshold = excluded.nonemployee_compensation_threshold,
    source_url = excluded.source_url,
    source_checked_at = now(),
    notes = excluded.notes;

create or replace function private.partner_tax_onboarding_required(target_kind text, compensation boolean)
returns boolean
language sql
immutable
as $$
  select compensation
    or target_kind in ('contracted_vendor','independent_contractor','clinical_provider');
$$;

create or replace function private.partner_classification_review_required(target_kind text)
returns boolean
language sql
immutable
as $$
  select target_kind = 'independent_contractor';
$$;

create or replace function public.initialize_partner_verification_case(target_org uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  p public.partner_profiles%rowtype;
  case_id uuid;
  tax_required boolean;
  class_required boolean;
begin
  if not private.current_user_is_staff() then
    raise exception 'staff authorization required';
  end if;

  select * into p from public.partner_profiles where organization_id = target_org;
  if not found then raise exception 'partner profile not found'; end if;

  tax_required := private.partner_tax_onboarding_required(p.partner_kind, p.compensation_expected);
  class_required := private.partner_classification_review_required(p.partner_kind);

  insert into public.partner_verification_cases (
    organization_id, partner_kind, compensation_expected,
    w9_required, w9_status,
    classification_review_required, classification_status,
    agreement_required, agreement_status,
    tax_reporting_status, verification_status, next_action
  )
  values (
    target_org, p.partner_kind, p.compensation_expected,
    tax_required, case when tax_required then 'required' else 'not_required' end,
    class_required, case when class_required then 'not_reviewed' else 'not_applicable' end,
    tax_required, case when tax_required then 'required' else 'not_required' end,
    case when tax_required then 'review_required' else 'not_applicable' end,
    'pending',
    case
      when tax_required then 'Collect current Form W-9 and required agreement'
      when class_required then 'Complete worker-classification review'
      else 'Complete partner verification review'
    end
  )
  on conflict (organization_id) do update
  set partner_kind = excluded.partner_kind,
      compensation_expected = excluded.compensation_expected,
      w9_required = excluded.w9_required,
      w9_status = case
        when excluded.w9_required and partner_verification_cases.w9_status = 'not_required' then 'required'
        when not excluded.w9_required then 'not_required'
        else partner_verification_cases.w9_status end,
      classification_review_required = excluded.classification_review_required,
      classification_status = case
        when excluded.classification_review_required and partner_verification_cases.classification_status = 'not_applicable' then 'not_reviewed'
        when not excluded.classification_review_required then 'not_applicable'
        else partner_verification_cases.classification_status end,
      agreement_required = excluded.agreement_required,
      agreement_status = case
        when excluded.agreement_required and partner_verification_cases.agreement_status = 'not_required' then 'required'
        when not excluded.agreement_required then 'not_required'
        else partner_verification_cases.agreement_status end,
      tax_reporting_status = excluded.tax_reporting_status,
      updated_at = now()
  returning id into case_id;

  return case_id;
end;
$$;

revoke all on function public.initialize_partner_verification_case(uuid) from public;
grant execute on function public.initialize_partner_verification_case(uuid) to authenticated;

create or replace view public.partner_verification_queue
with (security_invoker = true)
as
select
  c.id,
  c.organization_id,
  o.name as organization_name,
  c.partner_kind,
  c.compensation_expected,
  c.w9_required,
  c.w9_status,
  c.classification_review_required,
  c.classification_status,
  c.agreement_required,
  c.agreement_status,
  c.tax_reporting_status,
  c.verification_status,
  c.risk_level,
  c.assigned_to,
  c.next_action,
  c.due_at,
  c.created_at,
  c.updated_at,
  (
    (not c.w9_required or c.w9_status = 'accepted')
    and (not c.classification_review_required or c.classification_status = 'contractor_supported')
    and (not c.agreement_required or c.agreement_status = 'signed')
  ) as activation_ready,
  array_remove(array[
    case when c.w9_required and c.w9_status <> 'accepted' then 'W-9' end,
    case when c.classification_review_required and c.classification_status <> 'contractor_supported' then 'worker classification' end,
    case when c.agreement_required and c.agreement_status <> 'signed' then 'agreement' end
  ], null) as blockers
from public.partner_verification_cases c
join public.organizations o on o.id = c.organization_id;

alter table public.partner_verification_cases enable row level security;
alter table public.partner_verification_documents enable row level security;
alter table public.partner_classification_reviews enable row level security;
alter table public.tax_reporting_rules enable row level security;

create policy partner_cases_staff_read on public.partner_verification_cases
for select to authenticated using (private.current_user_is_staff());
create policy partner_cases_org_read on public.partner_verification_cases
for select to authenticated using (private.is_org_member(organization_id));
create policy partner_cases_staff_manage on public.partner_verification_cases
for all to authenticated using (private.current_user_is_staff())
with check (private.current_user_is_staff());

create policy partner_docs_staff_read on public.partner_verification_documents
for select to authenticated using (private.current_user_is_staff());
create policy partner_docs_org_read on public.partner_verification_documents
for select to authenticated using (private.is_org_member(organization_id));
create policy partner_docs_staff_manage on public.partner_verification_documents
for all to authenticated using (private.current_user_is_staff())
with check (private.current_user_is_staff());

create policy classification_staff_read on public.partner_classification_reviews
for select to authenticated using (private.current_user_is_staff());
create policy classification_staff_manage on public.partner_classification_reviews
for all to authenticated using (private.current_user_is_staff())
with check (private.current_user_is_staff());

create policy tax_rules_authenticated_read on public.tax_reporting_rules
for select to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('partner-tax-documents', 'partner-tax-documents', false)
on conflict (id) do nothing;

create or replace function private.is_org_member_text(target_org text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id::text = target_org
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

revoke all on function private.is_org_member_text(text) from public;
grant execute on function private.is_org_member_text(text) to authenticated;

create policy partner_tax_docs_member_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'partner-tax-documents'
  and private.is_org_member_text((storage.foldername(name))[1])
);

create policy partner_tax_docs_member_select on storage.objects
for select to authenticated
using (
  bucket_id = 'partner-tax-documents'
  and (
    private.is_org_member_text((storage.foldername(name))[1])
    or private.current_user_is_staff()
  )
);

create policy partner_tax_docs_staff_manage on storage.objects
for all to authenticated
using (bucket_id = 'partner-tax-documents' and private.current_user_is_staff())
with check (bucket_id = 'partner-tax-documents' and private.current_user_is_staff());

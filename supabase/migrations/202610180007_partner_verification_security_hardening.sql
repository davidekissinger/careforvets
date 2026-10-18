alter function private.partner_tax_onboarding_required(text, boolean)
  set search_path = public, pg_temp;

alter function private.partner_classification_review_required(text)
  set search_path = public, pg_temp;

drop function if exists public.initialize_partner_verification_case(uuid);

create or replace function private.initialize_partner_verification_case(target_org uuid)
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

revoke all on function private.initialize_partner_verification_case(uuid) from public;
revoke all on function private.initialize_partner_verification_case(uuid) from anon;
revoke all on function private.initialize_partner_verification_case(uuid) from authenticated;

create unique index if not exists partner_verification_document_kind_unique
  on public.partner_verification_documents(verification_case_id, document_type);

-- Production-readiness: self-service partner onboarding and controlled staff review actions.

create or replace function private.start_partner_onboarding(
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
security definer
set search_path = public, private, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  org_id uuid;
  case_id uuid;
  org_type text;
  tax_required boolean;
  class_required boolean;
  current_status text;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  if coalesce(trim(org_name), '') = '' then
    raise exception 'organization name is required';
  end if;

  if requested_partner_kind not in ('resource_referral','employer','contracted_vendor','independent_contractor','clinical_provider','other') then
    raise exception 'unsupported partner type';
  end if;

  org_type := case
    when requested_partner_kind = 'employer' then 'employer'
    when requested_partner_kind = 'clinical_provider' then 'provider'
    else 'partner'
  end;

  select o.id, o.verification_status
    into org_id, current_status
  from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = uid
    and m.status = 'active'
    and m.role in ('owner','partner_user','employer_user')
    and o.organization_type in ('partner','provider','employer')
  order by m.created_at
  limit 1;

  if org_id is not null and current_status = 'verified' then
    raise exception 'verified partner profile is managed through the active partner workspace';
  end if;

  if org_id is null then
    insert into public.organizations (
      name, organization_type, website, phone, service_area,
      status, verification_status, created_by
    )
    values (
      trim(org_name), org_type, nullif(trim(org_website), ''), nullif(trim(org_phone), ''),
      coalesce(org_service_area, '{}'::text[]),
      'pending', 'in_review', uid
    )
    returning id into org_id;

    insert into public.organization_memberships (organization_id, user_id, role, status)
    values (
      org_id, uid,
      case when org_type = 'employer' then 'employer_user' else 'owner' end,
      'active'
    );
  else
    update public.organizations
    set name = trim(org_name),
        organization_type = org_type,
        website = nullif(trim(org_website), ''),
        phone = nullif(trim(org_phone), ''),
        service_area = coalesce(org_service_area, '{}'::text[]),
        status = 'pending',
        verification_status = 'in_review',
        updated_at = now()
    where id = org_id;
  end if;

  insert into public.partner_profiles (
    organization_id, relationship_status, referral_method, eligibility_summary,
    accepts_referrals, outcome_updates_supported, partner_kind, compensation_expected,
    verification_stage
  )
  values (
    org_id, 'prospect', nullif(trim(requested_referral_method), ''),
    nullif(trim(requested_eligibility_summary), ''),
    requested_accepts_referrals, requested_outcome_updates,
    requested_partner_kind, requested_compensation, 'intake'
  )
  on conflict (organization_id) do update
  set relationship_status = case when public.partner_profiles.relationship_status = 'active' then 'active' else 'prospect' end,
      referral_method = excluded.referral_method,
      eligibility_summary = excluded.eligibility_summary,
      accepts_referrals = excluded.accepts_referrals,
      outcome_updates_supported = excluded.outcome_updates_supported,
      partner_kind = excluded.partner_kind,
      compensation_expected = excluded.compensation_expected,
      verification_stage = case when public.partner_profiles.verification_stage = 'approved' then 'approved' else 'intake' end,
      updated_at = now();

  delete from public.partner_services where partner_organization_id = org_id;

  insert into public.partner_services (partner_organization_id, service_category_id)
  select org_id, sc.id
  from public.service_categories sc
  where sc.active = true
    and sc.slug = any(coalesce(requested_service_slugs, '{}'::text[]))
  on conflict do nothing;

  tax_required := private.partner_tax_onboarding_required(requested_partner_kind, requested_compensation);
  class_required := private.partner_classification_review_required(requested_partner_kind);

  insert into public.partner_verification_cases (
    organization_id, partner_kind, compensation_expected,
    w9_required, w9_status,
    classification_review_required, classification_status,
    agreement_required, agreement_status,
    tax_reporting_status, verification_status, risk_level, next_action
  )
  values (
    org_id, requested_partner_kind, requested_compensation,
    tax_required, case when tax_required then 'required' else 'not_required' end,
    class_required, case when class_required then 'not_reviewed' else 'not_applicable' end,
    tax_required, case when tax_required then 'required' else 'not_required' end,
    case when tax_required then 'review_required' else 'not_applicable' end,
    'pending',
    case when class_required then 'elevated' else 'standard' end,
    case
      when tax_required then 'Submit required onboarding documents'
      when class_required then 'Complete worker-classification review'
      else 'Final partner verification review'
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
      tax_reporting_status = case when excluded.w9_required then 'review_required' else 'not_applicable' end,
      verification_status = case
        when partner_verification_cases.verification_status in ('approved','declined') then partner_verification_cases.verification_status
        else 'pending' end,
      risk_level = excluded.risk_level,
      next_action = excluded.next_action,
      updated_at = now()
  returning id into case_id;

  if tax_required then
    insert into public.partner_verification_documents (
      verification_case_id, organization_id, document_type, status
    )
    values (case_id, org_id, 'w9', 'requested')
    on conflict (verification_case_id, document_type) do nothing;

    insert into public.partner_verification_documents (
      verification_case_id, organization_id, document_type, status
    )
    values (case_id, org_id, 'contractor_agreement', 'requested')
    on conflict (verification_case_id, document_type) do nothing;

    update public.partner_profiles
    set verification_stage = 'documents', updated_at = now()
    where organization_id = org_id;
  elsif class_required then
    update public.partner_profiles
    set verification_stage = 'classification_review', updated_at = now()
    where organization_id = org_id;
  else
    update public.partner_profiles
    set verification_stage = 'final_review', updated_at = now()
    where organization_id = org_id;
  end if;

  if class_required then
    insert into public.partner_classification_reviews (verification_case_id, organization_id)
    values (case_id, org_id)
    on conflict (verification_case_id) do nothing;
  end if;

  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    uid, 'partner_onboarding_saved', 'organization', org_id::text,
    jsonb_build_object('verification_case_id', case_id, 'partner_kind', requested_partner_kind)
  );

  return jsonb_build_object(
    'organization_id', org_id,
    'verification_case_id', case_id,
    'w9_required', tax_required,
    'agreement_required', tax_required,
    'classification_review_required', class_required
  );
end;
$$;

revoke all on function private.start_partner_onboarding(text,text,text,text[],text,boolean,text,text,boolean,boolean,text[]) from public;
grant execute on function private.start_partner_onboarding(text,text,text,text[],text,boolean,text,text,boolean,boolean,text[]) to authenticated;

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
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.start_partner_onboarding(
    org_name, org_website, org_phone, org_service_area,
    requested_partner_kind, requested_compensation,
    requested_referral_method, requested_eligibility_summary,
    requested_accepts_referrals, requested_outcome_updates, requested_service_slugs
  );
$$;

revoke all on function public.start_partner_onboarding(text,text,text,text[],text,boolean,text,text,boolean,boolean,text[]) from public;
grant execute on function public.start_partner_onboarding(text,text,text,text[],text,boolean,text,text,boolean,boolean,text[]) to authenticated;

create or replace function private.submit_partner_document(
  target_case uuid,
  target_document_type text,
  target_storage_path text,
  target_document_name text,
  target_content_type text
)
returns public.partner_verification_documents
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  org_id uuid;
  d public.partner_verification_documents%rowtype;
begin
  if uid is null then raise exception 'authentication required'; end if;

  if target_document_type not in ('w9','contractor_agreement','insurance','license','other') then
    raise exception 'unsupported document type';
  end if;

  select c.organization_id into org_id
  from public.partner_verification_cases c
  where c.id = target_case
    and private.is_org_member(c.organization_id);

  if org_id is null then raise exception 'verification case unavailable'; end if;

  if target_storage_path is null
     or target_storage_path not like org_id::text || '/' || target_case::text || '/%' then
    raise exception 'invalid document storage path';
  end if;

  insert into public.partner_verification_documents (
    verification_case_id, organization_id, document_type, storage_path,
    document_name, content_type, status, uploaded_by, uploaded_at,
    viewed_by, viewed_at, view_count, reviewed_by, reviewed_at, reviewer_note
  )
  values (
    target_case, org_id, target_document_type, target_storage_path,
    target_document_name, target_content_type, 'uploaded', uid, now(),
    null, null, 0, null, null, null
  )
  on conflict (verification_case_id, document_type) do update
  set storage_path = excluded.storage_path,
      document_name = excluded.document_name,
      content_type = excluded.content_type,
      status = 'uploaded',
      uploaded_by = uid,
      uploaded_at = now(),
      viewed_by = null,
      viewed_at = null,
      view_count = 0,
      reviewed_by = null,
      reviewed_at = null,
      reviewer_note = null
  returning * into d;

  if target_document_type = 'w9' then
    update public.partner_verification_cases
    set w9_status = 'uploaded', verification_status = 'blocked',
        next_action = 'CareForVets review of submitted W-9', updated_at = now()
    where id = target_case;
  elsif target_document_type = 'contractor_agreement' then
    update public.partner_verification_cases
    set agreement_status = 'sent', verification_status = 'blocked',
        next_action = 'CareForVets review of submitted agreement', updated_at = now()
    where id = target_case;
  end if;

  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    uid, 'partner_document_submitted', 'partner_verification_document', d.id::text,
    jsonb_build_object('verification_case_id', target_case, 'document_type', target_document_type)
  );

  return d;
end;
$$;

revoke all on function private.submit_partner_document(uuid,text,text,text,text) from public;
grant execute on function private.submit_partner_document(uuid,text,text,text,text) to authenticated;

create or replace function public.submit_partner_document(
  target_case uuid,
  target_document_type text,
  target_storage_path text,
  target_document_name text,
  target_content_type text
)
returns public.partner_verification_documents
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.submit_partner_document(
    target_case, target_document_type, target_storage_path,
    target_document_name, target_content_type
  );
$$;

revoke all on function public.submit_partner_document(uuid,text,text,text,text) from public;
grant execute on function public.submit_partner_document(uuid,text,text,text,text) to authenticated;

create or replace function public.review_partner_document(
  target_document uuid,
  target_status text,
  reviewer_note text default null
)
returns public.partner_verification_documents
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  d public.partner_verification_documents%rowtype;
begin
  if not private.current_user_is_staff() then raise exception 'staff authorization required'; end if;
  if target_status not in ('accepted','rejected','needs_update') then raise exception 'unsupported review status'; end if;

  select * into d from public.partner_verification_documents where id = target_document;
  if not found then raise exception 'document not found'; end if;

  if target_status = 'accepted' and d.viewed_at is null then
    raise exception 'document must be viewed before acceptance';
  end if;

  update public.partner_verification_documents
  set status = target_status,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      reviewer_note = reviewer_note
  where id = target_document
  returning * into d;

  if d.document_type = 'w9' then
    update public.partner_verification_cases
    set w9_status = target_status,
        verification_status = case when target_status = 'accepted' then verification_status else 'blocked' end,
        next_action = case
          when target_status = 'accepted' then next_action
          when target_status = 'needs_update' then 'Partner must submit an updated W-9'
          else 'W-9 rejected; partner follow-up required' end,
        updated_at = now()
    where id = d.verification_case_id;
  elsif d.document_type = 'contractor_agreement' then
    update public.partner_verification_cases
    set agreement_status = case when target_status = 'accepted' then 'signed' else target_status end,
        verification_status = case when target_status = 'accepted' then verification_status else 'blocked' end,
        next_action = case
          when target_status = 'accepted' then next_action
          when target_status = 'needs_update' then 'Partner must submit an updated agreement'
          else 'Agreement rejected; partner follow-up required' end,
        updated_at = now()
    where id = d.verification_case_id;
  end if;

  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()), 'partner_document_' || target_status,
    'partner_verification_document', d.id::text,
    jsonb_build_object('document_type', d.document_type, 'verification_case_id', d.verification_case_id)
  );

  return d;
end;
$$;

revoke all on function public.review_partner_document(uuid,text,text) from public;
grant execute on function public.review_partner_document(uuid,text,text) to authenticated;

create or replace function public.save_partner_classification_review(
  target_case uuid,
  behavioral_summary text,
  financial_summary text,
  relationship_summary text,
  target_determination text,
  target_rationale text
)
returns public.partner_classification_reviews
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  c public.partner_verification_cases%rowtype;
  r public.partner_classification_reviews%rowtype;
begin
  if not private.current_user_is_staff() then raise exception 'staff authorization required'; end if;
  if target_determination not in ('contractor_supported','employee_risk','legal_review') then
    raise exception 'unsupported classification determination';
  end if;

  select * into c from public.partner_verification_cases where id = target_case;
  if not found or not c.classification_review_required then raise exception 'classification review not required for this case'; end if;

  insert into public.partner_classification_reviews (
    verification_case_id, organization_id, behavioral_control, financial_control,
    relationship_factors, determination, rationale, reviewed_by, reviewed_at
  )
  values (
    target_case, c.organization_id,
    jsonb_build_object('summary', behavioral_summary),
    jsonb_build_object('summary', financial_summary),
    jsonb_build_object('summary', relationship_summary),
    target_determination, nullif(trim(target_rationale), ''),
    (select auth.uid()), now()
  )
  on conflict (verification_case_id) do update
  set behavioral_control = excluded.behavioral_control,
      financial_control = excluded.financial_control,
      relationship_factors = excluded.relationship_factors,
      determination = excluded.determination,
      rationale = excluded.rationale,
      reviewed_by = excluded.reviewed_by,
      reviewed_at = excluded.reviewed_at,
      updated_at = now()
  returning * into r;

  update public.partner_verification_cases
  set classification_status = target_determination,
      verification_status = case when target_determination = 'contractor_supported' then verification_status else 'blocked' end,
      next_action = case
        when target_determination = 'contractor_supported' then next_action
        when target_determination = 'employee_risk' then 'Worker classification indicates employee risk; revise engagement'
        else 'Employment/legal review required before activation' end,
      updated_at = now()
  where id = target_case;

  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()), 'partner_classification_review_saved',
    'partner_verification_case', target_case::text,
    jsonb_build_object('determination', target_determination)
  );

  return r;
end;
$$;

revoke all on function public.save_partner_classification_review(uuid,text,text,text,text,text) from public;
grant execute on function public.save_partner_classification_review(uuid,text,text,text,text,text) to authenticated;

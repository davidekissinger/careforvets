-- Recalculate partner verification readiness after document decisions.
-- Includes the reviewer_note ambiguity fix and preserves view-before-accept.

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
  if target_status = 'accepted' and d.viewed_at is null then raise exception 'document must be viewed before acceptance'; end if;

  update public.partner_verification_documents as pvd
  set status = target_status,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      reviewer_note = $3
  where pvd.id = target_document
  returning pvd.* into d;

  if d.document_type = 'w9' then
    update public.partner_verification_cases as pvc
    set w9_status = target_status, updated_at = now()
    where pvc.id = d.verification_case_id;
  elsif d.document_type = 'contractor_agreement' then
    update public.partner_verification_cases as pvc
    set agreement_status = case when target_status = 'accepted' then 'signed' else target_status end,
        updated_at = now()
    where pvc.id = d.verification_case_id;
  end if;

  update public.partner_verification_cases as pvc
  set verification_status = case
        when pvc.final_review_status in ('approved','declined','paused') then pvc.verification_status
        when (not pvc.w9_required or pvc.w9_status = 'accepted')
         and (not pvc.classification_review_required or pvc.classification_status = 'contractor_supported')
         and (not pvc.agreement_required or pvc.agreement_status = 'signed')
         and pvc.risk_level <> 'high' then 'ready_for_review'
        else 'blocked'
      end,
      next_action = case
        when pvc.final_review_status in ('approved','declined','paused') then pvc.next_action
        when (not pvc.w9_required or pvc.w9_status = 'accepted')
         and (not pvc.classification_review_required or pvc.classification_status = 'contractor_supported')
         and (not pvc.agreement_required or pvc.agreement_status = 'signed')
         and pvc.risk_level <> 'high' then 'Final partner verification review'
        else array_to_string(array_remove(array[
          case when pvc.w9_required and pvc.w9_status <> 'accepted' then 'Resolve W-9 review' end,
          case when pvc.classification_review_required and pvc.classification_status <> 'contractor_supported' then 'Complete worker-classification review' end,
          case when pvc.agreement_required and pvc.agreement_status <> 'signed' then 'Resolve agreement review' end,
          case when pvc.risk_level = 'high' then 'Resolve high-risk review' end
        ], null), '; ')
      end,
      updated_at = now()
  where pvc.id = d.verification_case_id;

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

create or replace view public.partner_verification_queue
with (security_invoker = true)
as
select
  c.id, c.organization_id, o.name as organization_name, c.partner_kind, c.compensation_expected,
  c.w9_required, c.w9_status, c.classification_review_required, c.classification_status,
  c.agreement_required, c.agreement_status, c.tax_reporting_status, c.verification_status,
  c.risk_level, c.assigned_to, c.next_action, c.due_at, c.created_at, c.updated_at,
  (
    (not c.w9_required or c.w9_status = 'accepted')
    and (not c.classification_review_required or c.classification_status = 'contractor_supported')
    and (not c.agreement_required or c.agreement_status = 'signed')
    and c.risk_level <> 'high'
  ) as activation_ready,
  array_remove(array[
    case when c.w9_required and c.w9_status <> 'accepted' then 'W-9' end,
    case when c.classification_review_required and c.classification_status <> 'contractor_supported' then 'worker classification' end,
    case when c.agreement_required and c.agreement_status <> 'signed' then 'agreement' end,
    case when c.risk_level = 'high' then 'high-risk review' end
  ], null) as blockers,
  c.final_review_status, c.final_reviewed_by, c.final_reviewed_at,
  c.final_review_certification, c.final_review_note
from public.partner_verification_cases c
join public.organizations o on o.id = c.organization_id;

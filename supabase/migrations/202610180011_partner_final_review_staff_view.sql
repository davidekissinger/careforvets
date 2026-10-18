create or replace view public.partner_final_review_staff_view
with (security_invoker = true)
as
select
  c.id, c.organization_id, o.name as organization_name, o.website, o.phone, o.service_area,
  o.status as organization_status, o.verification_status as organization_verification_status,
  p.partner_kind, p.compensation_expected, p.relationship_status, p.verification_stage,
  p.referral_method, p.eligibility_summary, p.accepts_referrals, p.outcome_updates_supported,
  c.w9_required, c.w9_status, c.classification_review_required, c.classification_status,
  c.agreement_required, c.agreement_status, c.tax_reporting_status, c.verification_status,
  c.risk_level, c.next_action, c.final_review_status, c.final_reviewed_by, c.final_reviewed_at,
  c.final_review_certification, c.final_review_note, c.created_at, c.updated_at,
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
  ], null) as blockers
from public.partner_verification_cases c
join public.organizations o on o.id = c.organization_id
join public.partner_profiles p on p.organization_id = c.organization_id
where private.current_user_is_staff();

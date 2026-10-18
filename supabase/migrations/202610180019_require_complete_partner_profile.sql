-- Require a complete partner profile before showing final approval readiness.
create or replace view public.partner_verification_queue
with (security_invoker = true)
as
select
  c.id, c.organization_id, o.name as organization_name, c.partner_kind,
  c.compensation_expected, c.w9_required, c.w9_status,
  c.classification_review_required, c.classification_status,
  c.agreement_required, c.agreement_status, c.tax_reporting_status,
  c.verification_status, c.risk_level, c.assigned_to, c.next_action,
  c.due_at, c.created_at, c.updated_at,
  (
    c.verification_status not in ('approved','declined','paused')
    and coalesce(c.final_review_status, 'not_started') not in ('approved','declined','paused','changes_requested')
    and not (coalesce(c.next_action,'') ilike 'Closed administratively%')
    and (not c.w9_required or c.w9_status = 'accepted')
    and (not c.classification_review_required or c.classification_status = 'contractor_supported')
    and (not c.agreement_required or c.agreement_status = 'signed')
    and c.risk_level <> 'high'
    and cardinality(coalesce(o.service_area, '{}'::text[])) > 0
    and exists (
      select 1 from public.partner_services ps
      join public.service_categories sc on sc.id = ps.service_category_id
      where ps.partner_organization_id = c.organization_id and sc.active = true
    )
    and nullif(trim(p.referral_method), '') is not null
    and nullif(trim(p.eligibility_summary), '') is not null
  ) as activation_ready,
  array_remove(array[
    case when c.verification_status in ('approved','declined','paused')
         or c.final_review_status in ('approved','declined','paused','changes_requested')
         or coalesce(c.next_action,'') ilike 'Closed administratively%'
      then 'case closed / not eligible for activation' end,
    case when c.w9_required and c.w9_status <> 'accepted' then 'W-9' end,
    case when c.classification_review_required and c.classification_status <> 'contractor_supported' then 'worker classification' end,
    case when c.agreement_required and c.agreement_status <> 'signed' then 'agreement' end,
    case when c.risk_level = 'high' then 'high-risk review' end,
    case when cardinality(coalesce(o.service_area, '{}'::text[])) = 0 then 'service area' end,
    case when not exists (
      select 1 from public.partner_services ps
      join public.service_categories sc on sc.id = ps.service_category_id
      where ps.partner_organization_id = c.organization_id and sc.active = true
    ) then 'service categories' end,
    case when nullif(trim(p.referral_method), '') is null then 'referral method' end,
    case when nullif(trim(p.eligibility_summary), '') is null then 'eligibility summary' end
  ], null) as blockers,
  c.final_review_status, c.final_reviewed_by, c.final_reviewed_at,
  c.final_review_certification, c.final_review_note
from public.partner_verification_cases c
join public.organizations o on o.id = c.organization_id
left join public.partner_profiles p on p.organization_id = c.organization_id;

-- CareForVets Dev synthetic preview data.
-- DO NOT run in production. These records are fictional and exist only to exercise UI flows.

insert into public.organizations (name, slug, organization_type, status, verification_status, verified_at)
select '[DEMO] Veterans Health Network', 'demo-veterans-health-network', 'employer', 'active', 'verified', now()
where not exists (select 1 from public.organizations where slug='demo-veterans-health-network');

insert into public.jobs (
  organization_id, title, occupation_id, employment_type, location_text, remote_status,
  compensation_text, description, requirements, status, published_at
)
select o.id, '[DEMO] Registered Nurse — Home-Based Care', occ.id, 'Full time', 'Northwest Ohio', 'onsite',
       '$82,000–$96,000', 'Synthetic preview opening for testing the CareForVets career experience. This is not a real job posting.',
       'Demo requirements only. Do not apply as though this were a real opening.', 'published', now()
from public.organizations o
join public.occupations occ on occ.slug='rn'
where o.slug='demo-veterans-health-network'
and not exists (select 1 from public.jobs where title='[DEMO] Registered Nurse — Home-Based Care');

insert into public.jobs (
  organization_id, title, occupation_id, employment_type, location_text, remote_status,
  compensation_text, description, requirements, status, published_at
)
select o.id, '[DEMO] Veteran Care Scheduler', occ.id, 'Full time', 'Remote / Ohio', 'remote',
       '$48,000–$56,000', 'Synthetic preview opening for testing administrative career matching. This is not a real job posting.',
       'Demo requirements only.', 'published', now()
from public.organizations o
join public.occupations occ on occ.slug='scheduler'
where o.slug='demo-veterans-health-network'
and not exists (select 1 from public.jobs where title='[DEMO] Veteran Care Scheduler');

insert into public.jobs (
  organization_id, title, occupation_id, employment_type, location_text, remote_status,
  compensation_text, description, requirements, status, published_at
)
select o.id, '[DEMO] Physical Therapist', occ.id, 'Part time', 'Toledo, Ohio', 'onsite',
       '$58–$66/hour', 'Synthetic preview opening for testing therapy-role discovery. This is not a real job posting.',
       'Demo requirements only.', 'published', now()
from public.organizations o
join public.occupations occ on occ.slug='pt'
where o.slug='demo-veterans-health-network'
and not exists (select 1 from public.jobs where title='[DEMO] Physical Therapist');

insert into public.resources (
  title, provider_name, service_category_id, description, geography,
  eligibility_summary, verification_status, publication_status, last_reviewed_at
)
select '[DEMO] Veteran Benefits Navigation', '[DEMO] Community Partner', c.id,
       'Synthetic preview resource showing how benefits-navigation resources will be presented with status and provenance.',
       'Ohio', 'Preview only — no real eligibility criteria.', 'in_review', 'published', now()
from public.service_categories c
where c.slug='benefits'
and not exists (select 1 from public.resources where title='[DEMO] Veteran Benefits Navigation');

insert into public.resources (
  title, provider_name, service_category_id, description, geography,
  eligibility_summary, verification_status, publication_status, last_reviewed_at
)
select '[DEMO] Healthcare Career Bridge', '[DEMO] Workforce Partner', c.id,
       'Synthetic preview resource showing veteran-to-healthcare workforce support.',
       'National', 'Preview only — no real eligibility criteria.', 'in_review', 'published', now()
from public.service_categories c
where c.slug='employment'
and not exists (select 1 from public.resources where title='[DEMO] Healthcare Career Bridge');

insert into public.resources (
  title, provider_name, service_category_id, description, geography,
  eligibility_summary, verification_status, publication_status, last_reviewed_at
)
select '[DEMO] Veteran Small-Business Resource', '[DEMO] Business Support Partner', c.id,
       'Synthetic preview resource showing how entrepreneurship and business-support referrals can fit the CareForVets network.',
       'Ohio / National', 'Preview only — no real eligibility criteria.', 'in_review', 'published', now()
from public.service_categories c
where c.slug='entrepreneurship'
and not exists (select 1 from public.resources where title='[DEMO] Veteran Small-Business Resource');

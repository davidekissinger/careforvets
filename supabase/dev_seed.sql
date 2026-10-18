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


-- Enrich demo job-description content for job-detail testing.
update public.jobs
set description = 'This synthetic preview role represents a veteran-centered home-based nursing position. The RN would coordinate scheduled home visits, complete skilled nursing assessments within the scope of the role, provide patient and caregiver education, communicate changes in condition through the appropriate clinical chain, and collaborate with the interdisciplinary care team. The role is designed to demonstrate how CareForVets can present clinical opportunities with clear expectations, location, work setting, and compensation.',
    requirements = 'DEMO requirements only — this is not a real opening. Example qualifications: active RN license in the state of practice; current CPR certification; strong clinical documentation and communication skills; ability to work independently in home and community settings; reliable transportation when travel is required; home health, community health, veteran care, or related experience preferred.'
where title='[DEMO] Registered Nurse — Home-Based Care';

update public.jobs
set description = 'This synthetic preview role represents a veteran-centered scheduling and care-coordination position. The scheduler would manage visit calendars, communicate with clinicians and patients, help resolve scheduling conflicts, maintain accurate operational status, and support timely handoffs between referral, authorization, and care-delivery teams. The role demonstrates how CareForVets can include non-clinical healthcare careers alongside licensed clinical roles.',
    requirements = 'DEMO requirements only — this is not a real opening. Example qualifications: healthcare scheduling, customer service, operations, logistics, or administrative experience; strong phone and written communication; comfort managing multiple priorities; attention to detail; experience with home health, staffing, scheduling software, or veteran-serving organizations preferred.'
where title='[DEMO] Veteran Care Scheduler';

update public.jobs
set description = 'This synthetic preview role represents a physical therapy opportunity serving patients in home and community settings. The PT would evaluate functional mobility within the assigned scope, establish therapy goals, deliver skilled interventions, communicate progress, and collaborate with nursing and other disciplines. The role demonstrates how therapy careers can be incorporated into the CareForVets veteran workforce network.',
    requirements = 'DEMO requirements only — this is not a real opening. Example qualifications: active Physical Therapist license in the state of practice; graduate of an accredited PT program; current CPR certification where required; strong documentation and patient-education skills; ability to travel to assigned care locations; home health, geriatric, rehabilitation, or veteran-care experience preferred.'
where title='[DEMO] Physical Therapist';

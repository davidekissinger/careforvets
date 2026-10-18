# CareForVets Platform v2 — Architecture & Design Framework
**Version:** 0.1  
**Date:** 2026-10-18  
**Status:** Proposed technical architecture

## 1. Current State

### GitHub
Repository: `davidekissinger/careforvets`

The current production repository is a static HTML/CSS/JavaScript site with brand assets and documentation.

### Netlify
The existing CareForVets Netlify project deploys the public site from the GitHub `main` branch to `careforvets.com`.

### Supabase
No dedicated CareForVets Supabase project was present at the time this architecture was drafted. A dedicated project should be created for this product rather than sharing a database with unrelated products.

## 2. Recommended Deployment Topology

### Public site
**URL:** `https://careforvets.com`  
**Purpose:** Public information, search/discovery, care/career/resource/partner landing pages, public job and resource listings.

Retain the current static site initially. Add read-only dynamic components selectively.

### Authenticated portal
**Proposed URL:** `https://portal.careforvets.com`  
**Purpose:** Veteran/candidate, employer, partner, and CareForVets staff workflows.

Recommended implementation:
- React
- TypeScript
- Vite
- React Router
- Supabase JS client
- Netlify deployment

### Backend/data
**Platform:** Supabase  
**Initial environment:** synthetic/non-PHI development data only.

Capabilities:
- PostgreSQL
- Supabase Auth
- Row Level Security
- Storage
- Edge Functions only where useful
- SQL migrations committed to GitHub

### Server-side boundary
Use Netlify Functions when a secret-bearing service operation is required, especially:
- public form ingestion
- rate limiting / abuse controls
- server-only API integrations
- operations requiring Supabase service-role credentials

The Supabase service-role key must never be exposed to browser code.

## 3. Repository Layout

The existing root site can remain deployable while v2 is developed alongside it.

```text
careforvets/
├── index.html
├── care.html
├── careers.html
├── resources.html
├── partners.html
├── about.html
├── contact.html
├── assets/
├── portal/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── routes/
│   │   └── types/
│   └── public/
├── netlify/
│   └── functions/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   ├── tests/
│   └── functions/
└── docs/
    ├── CARE_FOR_VETS_BUILD_PIVOT_v2.md
    ├── CARE_FOR_VETS_PLATFORM_ARCHITECTURE_v2.md
    └── DESIGN_DOC_TEMPLATE.md
```

## 4. Environment Strategy

### Stage 1 — Development
Create one dedicated Supabase project named `CareForVets Dev`.

Rules:
- synthetic/test data only
- no PHI
- no real clinical records
- test candidate and partner accounts allowed only if users knowingly participate in a development system

### Stage 2 — Production
Create a separate `CareForVets Production` Supabase project before public authenticated launch.

Do not use the development database as the production database.

### Netlify
Recommended two-site setup from the same repository:
1. **careforvets** — existing public site
2. **careforvets-portal** — base directory `portal/`

Production branch: `main`  
Feature work: `feature/*` or `platform-v2/*`  
Pull requests: Netlify Deploy Previews

## 5. Core Domain Model

### Identity
#### `profiles`
- id = auth user id
- display_name
- email
- phone
- user_type
- status
- created_at
- updated_at

#### `organizations`
Supports employer, partner, provider, and CareForVets organizations.
- id
- name
- organization_type
- website
- phone
- address/geography
- status
- verification_status
- verified_at
- created_at

#### `organization_memberships`
- organization_id
- user_id
- role
- status

## 6. Career Network Model

### `candidate_profiles`
- user_id
- veteran_status_attested
- career_summary
- years_experience
- desired_work_types
- preferred_geographies
- remote_preference
- availability_date
- active_search_status
- visibility

### `occupations`
Configurable taxonomy, seeded with:
- RN
- LPN/LVN
- CNA/STNA
- HHA
- MSW/social work
- PT
- PTA
- OT
- COTA
- SLP
- speech-language assistant roles where applicable
- scheduler
- intake
- authorization
- credentialing
- billing/revenue cycle
- recruiting
- HR
- quality/compliance
- operations
- administration
- leadership/executive

### `candidate_occupations`
- candidate_id
- occupation_id
- experience_years
- primary_flag

### `credentials`
- candidate_id
- credential_type
- issuing_state_or_body
- credential_number
- issue_date
- expiration_date
- verification_status
- verified_at

Credential fields are private and must be tightly access-controlled.

### `skills`
### `candidate_skills`

### `jobs`
- organization_id
- title
- occupation_id
- employment_type
- location
- remote_status
- compensation_text
- description
- requirements
- status
- published_at
- closes_at

### `applications`
- job_id
- candidate_id
- status
- applied_at
- last_status_change_at
- source

### `application_events`
Immutable-ish timeline of status changes and notes.

## 7. Partners & Resources Model

### `partner_profiles`
- organization_id
- relationship_status
- verification_status
- referral_method
- service_area
- eligibility_summary
- accepts_referrals
- outcome_updates_supported
- last_verified_at

### `service_categories`
Seed categories:
- healthcare
- employment
- benefits
- service_connection
- education_training
- entrepreneurship
- business_certification
- emergency_financial
- housing
- legal
- transportation
- behavioral_health_peer_support
- community

### `partner_services`
Many-to-many join between partners and service categories.

### `resources`
- title
- provider/organization
- category
- description
- website
- geography
- eligibility
- source
- verification_status
- verified_at
- last_reviewed_at

### `referrals`
- veteran_user_id
- partner_organization_id
- service_category_id
- status
- consent_record_id
- created_by
- created_at
- closed_at

### `referral_events`
Event history:
- referral created
- consent confirmed
- sent
- acknowledged
- accepted
- engagement confirmed
- outcome received
- closed

Do not overwrite history; append events.

## 8. Care Navigation Model — Non-PHI Only

### `care_inquiries`
Permitted initial fields should be limited to routing data:
- name
- contact information
- veteran/family relationship
- geography
- broad service interest
- preferred contact method
- consent to contact
- created_at

Do not collect diagnosis, medication, assessment, clinical history, medical record number, or other clinical data in v2.

When the organization is ready to provide regulated clinical services, use a separate approved workflow/system for clinical intake.

## 9. Consent & Audit Model

### `consent_records`
- user_id
- consent_type
- version
- consented_at
- revoked_at
- source

### `audit_events`
- actor_user_id
- action
- entity_type
- entity_id
- metadata
- created_at

### `verification_events`
Track partner/resource/credential verification separately from ordinary edits:
- entity_type
- entity_id
- verification_type
- outcome
- verifier
- evidence/source
- verified_at

## 10. Authorization / RLS

RLS must be enabled on every table exposed through Supabase APIs.

### Public
May read only:
- published jobs
- public partner directory fields
- published resources
- public occupation/service taxonomies

### Candidate
May:
- read/update own profile
- manage own skills/credentials/documents
- view published jobs
- create/view own applications
- view own referrals where applicable

### Employer
May:
- manage own organization fields permitted by policy
- create/manage jobs for own organization
- view applications to own jobs subject to access rules

### Partner
May:
- manage approved partner-facing profile fields
- view referrals assigned to its organization
- update permitted referral statuses/outcomes

### CareForVets staff/admin
Role-based access through organization membership and explicit staff roles.

Never trust a browser-supplied organization id without RLS enforcing membership.

## 11. Storage

Recommended buckets:

### `public-brand`
Public assets only.

### `candidate-documents`
Private bucket:
- resumes
- license/certification evidence
- optional supporting documents

Access through signed URLs and RLS/storage policies.

### `partner-documents`
Private verification/onboarding records.

Do not create a clinical-record bucket in v2.

## 12. API / Function Boundaries

Use Netlify Functions or Supabase Edge Functions for:
- public unauthenticated form ingestion
- email notifications
- third-party API secrets
- admin-only workflows
- referral notifications
- scheduled verification reminders
- future partner integrations

Prefer direct Supabase client access only for operations that can be safely enforced with RLS.

## 13. Frontend Routes

### Public site
- `/`
- `/care`
- `/careers`
- `/resources`
- `/partners`
- `/about`
- `/contact`

### Portal
- `/login`
- `/onboarding`
- `/dashboard`
- `/career-profile`
- `/credentials`
- `/jobs`
- `/applications`
- `/referrals`
- `/organization`
- `/partner`
- `/admin`

Role-aware routing controls navigation; authorization remains enforced at the database layer.

## 14. Security Requirements

Release blockers:
- RLS enabled and tested
- no service-role key in browser bundle
- no PHI in v2
- private storage buckets for documents
- signed URL expiration
- server-side validation for public submissions
- rate limiting / abuse protection for public endpoints
- MFA required for staff/admin when practical
- secure headers
- dependency scanning
- audit trail for sensitive actions
- least-privilege policies

## 15. Accessibility & UX

Target WCAG 2.2 AA.

Requirements:
- keyboard navigation
- visible focus states
- semantic forms
- explicit validation
- accessible status messages
- sufficient color contrast
- mobile-first layouts
- no critical information conveyed by color alone

## 16. CI/CD

### GitHub
- pull request required for platform releases
- migrations committed with code
- automated lint/type/test checks
- secret scanning
- dependency alerts

### Netlify
- Deploy Preview for PRs
- production deploy from `main`
- environment variables managed in Netlify
- no production secrets in repository

### Supabase
- migrations are source-controlled
- schema changes applied through migrations
- production SQL changes are not made ad hoc unless captured immediately in a migration
- seed data excludes real personal/clinical data

## 17. Proposed Release Gates

### Gate A — Schema
- tables created by migration
- indexes
- constraints
- RLS
- seed data

### Gate B — Auth
- sign-in
- onboarding
- role assignment
- organization membership
- passwordless/email flow
- staff MFA plan

### Gate C — Career Network
- candidate profile
- credentials
- jobs
- applications
- employer dashboard

### Gate D — Partners Network
- partner directory
- verification
- referral workflow
- outcome status

### Gate E — Public Pivot
- care/career/resource/partner navigation
- content and disclaimers
- public listings
- connect flows

### Gate F — Production Readiness
- security review
- privacy review
- accessibility check
- backup/export plan
- monitoring
- incident response owner
- data retention rules

## 18. Future Clinical Boundary

Future home-health operations must not simply be added to these tables.

A future clinical architecture should explicitly decide:
- compliant hosting / BAA requirements
- clinical EHR/system of record
- PHI segregation
- clinical-role authorization
- clinical audit logging
- data-retention requirements
- interface between CareForVets navigation and the clinical provider

Until that design is approved, this platform remains a non-PHI navigation, workforce, resource, and partner network.

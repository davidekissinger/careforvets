# CareForVets Build Pivot — Veteran Services Network
**Version:** 0.1  
**Date:** 2026-10-18  
**Status:** Design / pre-build  
**Branch:** `platform-v2-design`

## 1. Purpose

CareForVets is being broadened from a primarily veteran-care / future home-health concept into a veteran services network organized around four connected pillars:

1. **Care** — care navigation, future home health, healthcare referrals, and veteran/family support.
2. **Careers** — veteran employment across clinical, therapy, social work, scheduling, administrative, operations, quality, recruiting, and leadership roles.
3. **Benefits & Resources** — navigation to trusted benefits, disability/service-connection, financial, entrepreneurial, certification, education, and community resources.
4. **Partners Network** — a curated network of organizations that can receive, support, or close the loop on veteran needs.

The unifying concept is broader than clinical care:

> **Care for the whole veteran experience — health, work, benefits, opportunity, and connection.**

## 2. Product Positioning

### Working brand promise
**Care for veterans. Careers for veterans. Connections that strengthen both.**

### Primary audiences
- Veterans and veteran family members
- Veteran job seekers
- Employers seeking veteran talent
- Healthcare organizations
- Veteran service organizations and community partners
- Benefits/resource organizations
- CareForVets internal administrators

### Core user journeys

#### Veteran seeking care or support
`Veteran → Need → Care/Resource Category → Partner or CareForVets pathway → Referral → Status → Outcome`

#### Veteran seeking employment
`Veteran → Career Profile → Credentials/Skills → Job Match → Application → Employer Review → Placement/Outcome`

#### Employer seeking talent
`Employer → Organization Profile → Job / Talent Need → Candidate Match → Interview/Selection → Outcome`

#### Partner organization
`Partner → Organization Profile → Service Categories → Referral Pathway → Referral Receipt → Status Update → Outcome`

## 3. Employment Scope

The career network should support a broad healthcare and administrative workforce rather than only nurses.

### Clinical and direct-care roles
- RN
- LPN/LVN
- CNA/STNA
- HHA
- Social work / MSW
- PT
- PTA
- OT
- COTA
- SLP
- Speech-language assistant roles where applicable
- Other licensed, certified, and assistant-level healthcare disciplines as added to the occupation taxonomy

### Administrative and operational roles
- Scheduler
- Intake coordinator
- Authorization specialist
- Credentialing specialist
- Billing / revenue-cycle roles
- Recruiter
- HR / people operations
- Quality / compliance
- Office / branch administration
- Clinical operations
- Leadership and executive roles

The data model should use a configurable occupation taxonomy rather than hard-coding only the first-launch roles.

## 4. Partners Network Scope

The Partners Network is not intended to be a simple links page. Each participating or listed partner should have structured information and a defined relationship status.

### Partner categories
- Healthcare and care delivery
- Employment and workforce development
- Benefits and service-connection support
- Education and training
- Entrepreneurship and small-business support
- Business certifications
- Emergency financial support
- Housing
- Legal support
- Transportation
- Behavioral health / peer support
- Community and veteran organizations

The framework should accommodate networking resources raised in discussions with Andrew, including benefits/service-connection assistance, entrepreneurial and business resources, certifications, emergency financial support, OhioMeansJobs-related connections, and Battle Buddy Benefits. These are leads or network sources to evaluate and verify, not automatically approved CareForVets partners.

### Partner record requirements
- Organization name
- Partner category/categories
- Services offered
- Population served
- Eligibility notes
- Geography / service area
- Contact and referral method
- Website / source
- Relationship status
- Verification status
- Last verified date
- Referral requirements
- Outcome/update capability
- Internal notes and provenance

### Closed-loop referral model
`Need Identified → Consent → Referral Sent → Referral Accepted → Engagement → Outcome Confirmed → Closed`

The system must not represent a referral as completed or successful without actual evidence.

## 5. Public Website Pivot

The public website should remain clear, lightweight, and accessible while changing the top-level story.

### Proposed navigation
- Care
- Careers
- Benefits & Resources
- Partners Network
- About
- Connect

### Homepage routing
The homepage should quickly route users into four clear paths:

- **I need care**
- **I'm looking for work**
- **I need benefits or support**
- **I represent an organization**

### Existing content to preserve or evolve
- CareForVets logo and brand identity
- Care, Excellence, Respect
- Veteran-centered tone
- Existing home-health development disclosures
- Existing non-affiliation / no-VA-endorsement disclosures
- Existing PHI caution until a compliant clinical environment exists

## 6. MVP Definition

### MVP-A — Public Network
- Revised homepage and navigation
- Care overview
- Careers overview
- Benefits/resources directory
- Partners Network directory
- Employer/partner interest forms
- Veteran talent-network interest form
- Existing contact workflow retained

### MVP-B — Authenticated Career Network
- Veteran/candidate account
- Career profile
- Skills
- Credentials/licenses/certifications
- Availability and work preferences
- Resume/document upload
- Jobs
- Applications
- Application status
- Employer organization account
- Job posting / talent-request workflow
- Internal admin review

### MVP-C — Partner Network
- Partner organization profiles
- Service taxonomy
- Referral pathway definition
- Partner onboarding/verification
- Referral tracking
- Referral event history
- Outcome capture
- Admin verification queue

### MVP-D — Care / Resource Navigation
- Non-clinical care inquiry
- Resource matching
- Partner referral
- Veteran consent tracking
- Status/outcome tracking

## 7. Explicit v2 Exclusions

The following are out of scope for the initial platform release unless separately approved:

- Patient clinical charting
- OASIS
- Clinical plans of care
- Medicare billing
- VA billing
- Claims submission
- Medication data
- Diagnosis capture
- EHR replacement
- Payroll
- Full workforce scheduling
- Full ATS replacement
- Automated credential verification claims
- Automated benefits or disability-claim adjudication
- AI making clinical, hiring, benefits, or eligibility decisions
- Storage of PHI in the initial Supabase environment

## 8. Data Boundary

Version 2 should be designed as a **non-PHI veteran services and workforce platform**.

A care inquiry may collect only the minimum information needed to route a person to the correct next step. Clinical history, diagnoses, medications, assessments, and other protected health information remain outside this platform.

If CareForVets later launches a licensed clinical service, clinical records should be handled through a separately approved HIPAA-compliant boundary and/or clinical system of record.

## 9. Success Measures

Initial product measures:
- Veteran accounts created
- Completed career profiles
- Employers onboarded
- Jobs posted
- Applications submitted
- Interviews / placements recorded
- Partners verified
- Referrals sent
- Referrals accepted
- Referral outcomes confirmed
- Resources reviewed and kept current
- Public-to-account conversion rate
- Time from submitted inquiry to acknowledged next step

These metrics measure actual activity; they should not imply clinical outcomes or successful employment without evidence.

## 10. Build Principles

1. **Progressive migration, not a rewrite of everything at once.**
2. **Public site remains fast and simple.**
3. **Authenticated workflows live in a purpose-built portal.**
4. **GitHub is the source of truth for code and database migrations.**
5. **Netlify handles deploys and serverless boundaries.**
6. **Supabase provides Auth, Postgres, Storage, and row-level authorization.**
7. **Every external-facing status should be evidence-based.**
8. **No PHI in v2.**
9. **Every sensitive table uses RLS before release.**
10. **A future clinical product must be intentionally separated from the workforce/resource platform.**

## 11. Open Business Decisions

Before full production launch, resolve:
- CareForVets legal entity structure for careers/staffing versus future home health
- Direct-hire recruiting vs contract staffing vs both
- Employer pricing model
- Partner inclusion and verification policy
- Veteran-status verification method
- Candidate credential-verification policy
- Whether employers may self-post jobs or require approval
- Whether partners may self-manage profiles
- Referral consent language
- Data-retention policy
- Future regulated/PHI architecture

## 12. Release Direction

The recommended v2 direction is to preserve the current public site while adding an authenticated portal and Supabase foundation. Public content can be progressively revised without putting the current production website at risk.

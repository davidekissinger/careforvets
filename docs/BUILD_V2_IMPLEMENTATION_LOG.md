# CareForVets BUILD v2 — Implementation Log

## 2026-10-18 — Foundation scaffold

Branch: `BUILD-v2-careforVETS`

### Added
- React + TypeScript + Vite portal under `/portal`
- CareForVets-branded dashboard and four-pillar navigation
- Initial routes for Care, Careers, Resources, Partners, Dashboard, and Login
- Passwordless Supabase sign-in wiring, inactive until environment variables are configured
- Explicit non-PHI banner and development boundary
- Netlify SPA configuration for the future portal site
- GitHub Actions portal build check
- Supabase foundation migration
- Occupation and service-category seed migration
- RLS smoke-test checklist
- Private candidate-document storage policy

### Database domains scaffolded
Profiles, organizations, memberships, occupations, candidate profiles, skills, credentials, jobs, applications, partner profiles, service categories, resources, consent, referrals, and audit events.

### Release boundary
This build is a veteran services/workforce platform, not an EHR, OASIS system, billing platform, or clinical record.

### Next dependency
Create a dedicated `CareForVets Dev` Supabase project, apply the migrations, configure portal environment variables, and create the second Netlify portal project.


## 2026-10-18 — Netlify portal project reserved

- Netlify project created: `careforvets-portal`
- Netlify site ID: `2f6e5c6b-dc09-4913-9dc7-ac4c3cc48bae`
- Intended hostname: `portal.careforvets.com`
- Current state: project shell created; Git repository/deploy connection still needs to be attached to the `portal/` base directory.
- Existing public `careforvets.com` production project remains unchanged.


## 2026-10-18 — Supabase project creation blocked by free-project limit

- User approved creation of `CareForVets Dev` at the quoted $0/month cost.
- Supabase rejected creation because the account already has the maximum two active free projects.
- Active projects: `CareNova Response` and `david-personal-knowledge`.
- `ClinicalSOS` is currently inactive.
- No existing Supabase project was paused, renamed, reused, or modified.
- Build can continue once the user chooses to pause one active project or upgrades capacity.


## 2026-10-18 — CareForVets Dev created and initialized

- Paused `CareNova Response` at the user's direction to free a Supabase free-project slot.
- Created `CareForVets Dev` in the CareNova Supabase organization at $0/month.
- Supabase project ID: `nokelqwbbhjsamyndoby`
- Region: `us-east-2`
- Applied foundation schema/RLS migration.
- Applied occupation and service-category seed migration.
- Configured the `careforvets-portal` Netlify project with the Supabase URL and publishable browser key.
- Ran Supabase security advisors.
- Hardened SECURITY DEFINER helper functions by moving them to a private schema and updated RLS policy references.
- Security advisor result after hardening: no security lints.
- Portal Netlify project still requires Git repository/deploy attachment before it can publish `portal.careforvets.com`.


## 2026-10-18 — Authenticated careers/resource flows

- Added Supabase auth session handling and passwordless sign-in UI.
- Added automatic profile creation for new authenticated users.
- Added a seeded internal `CareForVets` organization record.
- Added functional veteran career-profile editing backed by Supabase.
- Added public jobs and reviewed-resources data views with intentional empty states until real records are published.
- GitHub Actions initially caught relation-typing errors in the Supabase joins; both were corrected.
- Latest BUILD v2 portal CI completed successfully.
- Netlify portal visitor access was changed from team-SSO-only to public access so the eventual login page can be reached by external users.
- Remaining deployment dependency: connect the Netlify `careforvets-portal` project to the GitHub repository/BUILD branch with `portal/` as the base directory, then configure the custom portal domain and Supabase Auth redirect allowlist.

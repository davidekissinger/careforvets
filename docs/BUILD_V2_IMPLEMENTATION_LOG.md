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

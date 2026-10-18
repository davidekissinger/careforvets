# CareForVets Platform v2 — Design Index
**Date:** 2026-10-18

This branch scopes the CareForVets pivot from a primarily veteran-care / future home-health site into a broader veteran services network spanning care, careers, benefits/resources, and a Partners Network.

## Documents
1. [Build Pivot](./CARE_FOR_VETS_BUILD_PIVOT_v2.md) — product scope, users, MVP, partner/employment model, boundaries, and open business decisions.
2. [Platform Architecture](./CARE_FOR_VETS_PLATFORM_ARCHITECTURE_v2.md) — GitHub/Netlify/Supabase topology, data model, security, deployment, and release gates.
3. [Design Document Template](./DESIGN_DOC_TEMPLATE.md) — reusable framework for every material feature or integration.

## Recommended next build sequence
1. Approve scope and terminology.
2. Create `CareForVets Dev` Supabase project.
3. Add `portal/` React + TypeScript + Vite application.
4. Commit initial Supabase migrations with RLS.
5. Create second Netlify site for `portal.careforvets.com`.
6. Build account/onboarding foundation.
7. Build Careers.
8. Build Partners Network.
9. Add resources and closed-loop referral tracking.
10. Pivot public site navigation/content.
11. Security/accessibility/release review.
12. Production Supabase project and launch migration.

## Production constraint
The current public site remains the production site while v2 is developed. This branch is documentation/design only and does not alter the live site.

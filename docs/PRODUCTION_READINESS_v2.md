# CareForVets BUILD v2 — Production Readiness

**Status:** Release candidate hardening in progress  
**Date:** 2026-10-18

## Completed release gates

- BUILD v2 synchronized with production Warm Stone v1.1 branding.
- GitHub CI builds the Vite portal on every BUILD-v2 push.
- Supabase platform foundation and partner-verification migrations applied.
- Supabase security advisor: zero findings.
- Partner verification includes:
  - relationship classification,
  - W-9 requirement logic,
  - private tax-document storage,
  - view-before-accept enforcement,
  - contractor/vendor agreement review,
  - independent-contractor classification review,
  - final human approval gate,
  - decision history and audit events.
- Self-service partner onboarding implemented:
  - organization profile,
  - service categories,
  - referral method,
  - eligibility,
  - compensation expectation,
  - W-9 upload,
  - contractor/vendor agreement upload,
  - resumable onboarding.
- Demo careers/resources moved to browser-local test data.
- Database demo jobs, resources, and demo employer organization removed.
- Partner foreign-key indexes added.
- BUILD v2 is synchronized with main and is no longer behind production.

## Production release gates still requiring external/account configuration

### 1. Netlify production portal connection
Connect the existing Netlify project `careforvets-portal` to:
- Repository: `davidekissinger/careforvets`
- Production branch: `main`
- Package/base directory: `portal`
- Build command: `npm run build`
- Publish directory: `dist`

Do not replace the existing public `careforvets.com` site. The portal remains a separate application.

### 2. Portal custom domain
Add `portal.careforvets.com` to the `careforvets-portal` Netlify project and create the required DNS record.

### 3. Supabase Auth production URLs
Configure the CareForVets Supabase project:
- Site URL: `https://portal.careforvets.com`
- Allowed redirect URL: `https://portal.careforvets.com/dashboard`
- Keep deploy-preview URLs out of production authentication unless explicitly needed for QA.

### 4. First CareForVets staff user
Create the first real authenticated CareForVets user, then add that user to the internal CareForVets organization with an authorized role such as `owner` or `admin`.

### 5. Real end-to-end release test
With the production portal URL and staff account:
1. Sign in with a real magic link.
2. Sign out and sign back in.
3. Create a partner account.
4. Complete partner onboarding.
5. Upload a W-9.
6. Upload a signed contractor/vendor agreement when required.
7. Review documents as CareForVets staff.
8. Complete worker-classification review when required.
9. Conduct final partner review.
10. Approve the partner.
11. Verify organization/partner status and audit history.
12. Confirm a partner user cannot access staff-only verification functions.

## Production data policy

- No synthetic `[DEMO]` jobs, resources, organizations, or tax documents belong in production.
- Preview/test mode uses browser-local synthetic records.
- Clinical records, diagnoses, medications, assessments, OASIS data, plans of care, and other PHI remain outside CareForVets BUILD v2.
- W-9 taxpayer identifiers remain inside private documents and are not copied into ordinary application tables.

## Release decision

Do not merge PR #1 solely to trigger the portal release until the Netlify portal connection and Supabase Auth URLs are configured. Once those external gates are complete, run the end-to-end release test and then merge the release candidate into `main`.

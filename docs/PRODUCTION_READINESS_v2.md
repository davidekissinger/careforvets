# CareForVets BUILD v2 — Production Readiness

**Status:** Release candidate; custom-domain and security configuration gates remain  
**Last verified:** 2026-10-18

## Verified complete

- BUILD v2 is synchronized with production Warm Stone v1.1 branding and is 63 commits ahead of `main`, 0 behind.
- Separate Netlify project `careforvets-portal` is connected to `davidekissinger/careforvets` and currently deploys branch `BUILD-v2-careforVETS` from base directory `portal`.
- The latest portal production-context deploy is Ready; GitHub build checks passed.
- The first real Auth user exists and has one active internal CareForVets `owner` membership. Profile type is `staff`.
- Real login was completed in the browser; the authenticated portal displayed the staff Verification navigation.
- Partner document review and final-review pages were exercised using the CareForVets internal/duplicate test case.
- The document acceptance function was corrected to remove the ambiguous `reviewer_note` reference and to recalculate readiness after document decisions.
- The internal CareForVets duplicate partner case is paused, marked administratively closed, and cannot be considered activation-ready.
- Confirmed test-only W-9 and agreement files were deleted through the Storage API. Verification confirms zero matching Storage objects and zero document records; one cleanup audit event exists. Historical decision/audit records remain.
- Database demo jobs and resources are removed (zero `[DEMO]` job/resource rows); preview demos use browser-local synthetic records.
- Self-service partner onboarding, resumable organization profile, service categories, W-9/agreement upload, worker-classification review, final human approval, decision history, and audit-event workflows are implemented.
- A database safeguard prevents an organization named CareForVets or classified as the internal platform from being approved as an external partner.
- Supabase schema and partner queue now exclude administratively closed cases from activation readiness.
- Partner foreign-key indexes were added.
- GitHub build checks passed on the latest BUILD branch commit, and the latest Netlify portal preview is Ready.

## Remaining release gates

### 1. Add the custom portal domain
In Netlify, open the `careforvets-portal` project → Domain management → Add a domain, and add:

`portal.careforvets.com`

Follow the exact DNS record/target Netlify displays. Do not guess the CNAME target. Keep the existing public `careforvets.com` site separate.

### 2. Add the custom-domain Auth redirect
The `careforvets-portal.netlify.app` authentication path has worked. Before switching users to the custom domain, in Supabase → Authentication → URL Configuration:
- Set Site URL to `https://portal.careforvets.com` once the custom domain is live.
- Add `https://portal.careforvets.com/dashboard` to allowed redirect URLs.
- Keep `https://careforvets-portal.netlify.app/dashboard` during transition/rollback.
- Ensure the signup/confirmation email template uses the redirect-aware destination (for example `{{ .RedirectTo }}`) where applicable.
- Test a new confirmation/sign-in email; do not reuse links that contain an old session token.

### 3. Enable leaked-password protection
Supabase Security Advisor currently warns that leaked-password protection is disabled. Enable it in Supabase Auth password/security settings before public launch. This is a security hardening requirement even though the portal primarily uses email-link authentication.

### 4. Finish external-partner end-to-end testing
The admin review workflow has been tested, but the full external partner path has not yet been independently verified. Using a dedicated test partner account and synthetic files only:
1. Register/sign in as a partner.
2. Create and resume the partner profile.
3. Submit service area, service categories, referral method, eligibility, and compensation expectation.
4. Upload a synthetic W-9 and synthetic signed agreement when required.
5. Verify that the partner account cannot access staff-only verification/classification/final-review routes or data.
6. Sign in as staff and review each document after opening it.
7. Complete worker-classification review when applicable.
8. Conduct final review on a genuinely external test partner with complete profile data.
9. Verify approved status and audit trail.
10. Remove test uploads/records afterward.

Do not use the internal CareForVets platform record as the external partner in this test.

### 5. Release branch cutover
Keep PR #1 open and in draft until gates 1–4 are complete. Once they pass:
- Merge BUILD v2 into `main`.
- Change the `careforvets-portal` production branch to `main`.
- Confirm the `main` deploy is Ready and that the custom-domain login and key routes still work.

## Production data and privacy rules

- No synthetic `[DEMO]` jobs, resources, organizations, or tax documents belong in production.
- Use browser-local synthetic data for preview demonstrations.
- Do not enter clinical records, diagnoses, medications, assessments, OASIS data, plans of care, or other PHI into this portal.
- Keep W-9 taxpayer IDs inside private documents; do not copy them into ordinary application tables.
- Use synthetic W-9s and agreements in testing. Delete test files through Supabase Storage APIs, not direct SQL deletion from `storage.objects`.

## Current release decision

**Do not merge yet.** The separate portal is deployed and real staff login has been demonstrated on the Netlify subdomain. Remaining gates are custom-domain/DNS, custom-domain Auth redirect, leaked-password protection, and the external partner-to-staff end-to-end test. After these pass, merge and switch the portal's production branch to `main`.

# CareForVets public SEO implementation

Implements the **CareForVets SEO Design Document v1.0, November 5, 2026**. The full specification is preserved in [design-specification.md](design-specification.md). This work extends the existing public website from `main`; the separate BUILD v2 authenticated portal and PR #1 are outside this change.

## Architecture and status

| Route | Status | Primary action |
| --- | --- | --- |
| `/` | Built | Explore care options or caregiver support |
| `/care-navigation/` | Built as information; direct navigation service is developing | Choose a support topic |
| `/caregivers/` | Built | Explore tasks and official caregiver resources |
| `/resources/` | Built | Search/filter the 18 official resource records |
| `/resources/care-at-home/` | Built as education; home health remains developing | Visit official care access information |
| `/resources/disability-and-rehabilitation/` | Built | Review education, benefits, and access resources |
| `/resources/mental-health-support/` | Built | Choose routine support or direct urgent help |
| `/resources/veterans-benefits/` | Built | Visit official information or accredited-representative guidance |
| `/careers/` | Built as career guidance | Explore healthcare role families |
| `/careers/healthcare-careers/` | Built | Compare role families and employment-support resources |
| `/partners/` | Built as information | Read criteria and make a general inquiry |
| `/about/` | Built | Understand the owner, purpose, and current model |
| `/contact/` | Built with email as the default; web form gated by readiness | Choose the appropriate route or send a non-clinical email |
| `/locations/toledo-oh/` | Conditional; excluded from generated site and sitemap | Requires verified local scope and distinct access information |

Supporting public pages: `/editorial-standards/`, `/accessibility/`, `/privacy/`, `/terms/`. The confirmation page `/thank-you/` and genuine `404.html` error page carry `noindex` and are excluded from the sitemap.

The build produces **19 HTML pages, with 17 indexable production destinations**. The conditional Toledo specification is retained in `src/config.mjs`; unknown paths, including that unpublished route, return 404.

## User experience and content

- Preserve the existing logo, brand imagery, navy/red colors, Warm Stone field, and Care / Excellence / Respect values.
- Use readable 18px body text, semantic headings, visible keyboard focus, labeled forms, responsive navigation, and useful no-JavaScript fallbacks.
- Organize public content by task. Do not ask visitors to disclose a diagnosis before browsing resources.
- Render resource records directly in HTML. Search and category filtering happen only in browser memory, with an announced result count and a useful empty state.
- Resource records contain purpose, intended audience, access limitations, official links, and actual check dates. See [resource-verification.md](resource-verification.md).
- Preserve the existing `info@careforvets.com` contact and `careforvets-contact` Netlify form identity. Reduce form fields to name, email, optional organization, broad inquiry purpose, and a general message.
- Netlify reported Forms disabled for the public project on November 6, 2026. Default to a visible email action and a hidden static form blueprint. Set `CONTACT_FORM_ENABLED=true` only after processing and the receiving workflow are verified. No Netlify account setting is changed.
- When enabled, provide native required-field validation and progressive submission feedback. A failed request keeps entries and does not navigate to confirmation. A successful HTTP response from form processing precedes the confirmation redirect.
- Keep care information, career guidance, and organizational questions distinct. There are no fabricated vacancies, uploaded documents, active partner-onboarding controls, or treatment/intake promises.

## SEO and hosting

- The dependency-free Node build writes only static public output to `dist/`. Source, tests, design documentation, and private workflows are not published.
- All page templates emit meaningful unique titles/descriptions, one H1, absolute canonical URLs, Open Graph/Twitter metadata, and HTML links.
- Use truthful Organization markup on Home/About and BreadcrumbList on appropriate deeper pages. No invented clinical entity, ratings, JobPosting, LocalBusiness, or FAQ rich-result promises.
- Generate a production sitemap from the page inventory. `lastmod` uses a deliberate content date, not a build timestamp.
- Map prior `.html` addresses individually to their replacement destinations. No wildcard SPA success fallback and no redirects that merely toggle trailing slashes.
- Build with Netlify `CONTEXT=deploy-preview` or `branch-deploy` to put `noindex` in every HTML page and a global `X-Robots-Tag`; preview sitemaps have no entries. Robots remain crawlable so these directives can be seen.
- Production output has indexable public pages and no accidental global `noindex`. Utility pages remain excluded in both contexts.
- Assets are local, with explicit image dimensions, deferred small JavaScript, and cache revalidation. No third-party fonts or analytics are required.
- `Referrer-Policy: no-referrer` prevents outbound resource navigation from forwarding a sensitive page path. CSP restricts connections and form actions to the same origin; scripts and styles are local.

## Validation and operational follow-through

`npm run test:static` checks route/metadata/schema/link/sitemap/redirect/form contracts, unpublished-route exclusion, resource records, and production/preview indexing. It restores production output after the preview check.

`npm run test:browser` checks all 19 routes at desktop/mobile sizes, image loading, overflow, browser errors, navigation, in-memory resource controls, invalid form submission, and focused accessibility audits. The harness blocks outbound requests and form transmission. It records QA evidence under gitignored `artifacts/qa/`.

These checks do not establish a real Netlify inbox delivery or notification, Search Console ownership, or field Core Web Vitals. Before a production release, review the resulting deploy preview and establish Search Console ownership/baseline where access is available. Form detection and the receiving workflow must be verified before enabling the optional website form; they do not block the default email route. Do not activate the separate portal to satisfy public SEO checks.

## Publication gates

1. A Toledo/local page needs confirmed public service scope, useful verified local access information, and an owner for updates.
2. Job pages need genuine vacancies, employer details, application instructions, and expiry handling.
3. A partner approval or onboarding workflow needs its own completed operational/security acceptance. This informational partner page does not enable it.
4. Direct clinical/home-health claims need actual operational approvals, capacity, and access arrangements.
5. Resource maintenance needs an assigned human owner and substantive rechecks. `src/config.mjs` records the first suggested review due date; no automatic refresh of verification dates occurs.

## Measurement

No analytics, advertising pixels, session replay, local storage, or query-string tracking are added. Search Console can provide aggregate discovery and indexation data after ownership is established. Use internal aggregate inquiry outcomes to assess scope and geography fit.

Future analytics require a separate reviewed configuration: exclude personal/sensitive form contents, health topics, referral destinations, private identifiers, full sensitive page paths, and crisis interactions. Do not count a button click as a completed inquiry or a resource visit as a completed referral. Growth targets follow a measured baseline and operating capacity.

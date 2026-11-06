# CareForVets public website

The CareForVets public site implements the November 5, 2026 SEO design specification as an accessible static website. It serves military veterans, family caregivers, people exploring healthcare careers, and organizations seeking information about the developing CareForVets model.

## Local development

Requires Node 22 or newer. The production build has no runtime dependencies.

```bash
npm ci
npm run build
npm run serve
```

Open http://127.0.0.1:4173. The local server serves real pages and 404s, and applies the legacy redirect map. It deliberately rejects POST requests; real form processing belongs to Netlify. No local preview inquiry is delivered.

## Validation

```bash
npm run build
npm run test:static
npx playwright install chromium
npm run test:browser
```

The static checks exercise production and preview indexing rules, then restore production output. The browser suite checks desktop/mobile pages, accessibility, navigation, resource filtering, form validation, and outbound-network privacy. It never sends an inquiry. Screenshots and results go to gitignored `artifacts/qa/`.

For an existing browser installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Set `BASE_URL` to inspect a running local server. The GitHub Actions public-site workflow performs the build and checks on relevant pull requests.

## Content and architecture

- `src/config.mjs`: public identity, navigation, category definitions, review dates, legacy redirects, and the unpublished Toledo specification.
- `src/content/primary-pages.mjs`: home, care navigation, caregivers, resource pathways, general contact, and utility pages.
- `src/content/secondary-pages.mjs`: careers, partner information, About, editorial standards, privacy, accessibility, and terms.
- `src/content/resources.mjs`: 18 current official resource records with access information and source-check dates.
- `src/components.mjs`: shared accessible HTML, metadata, structured data, breadcrumbs, resource records, and navigation.
- `assets/`: existing authorized brand images plus shared CSS and progressive enhancement.
- `scripts/build.mjs`: static output generation, sitemap, robots, redirects, and context-specific headers.
- `docs/seo/`: complete design specification, implementation mapping, source verification, and validation evidence.

The generated site has 19 HTML pages: 13 core public pages, four supporting policy/editorial pages, a confirmation page, and a genuine error page. Seventeen destinations are indexable in production. The proposed Toledo page is not generated until its geographic and service prerequisites are confirmed. The resource directory works without JavaScript; optional search and category filtering happen entirely in browser memory.

## GitHub and Netlify

The existing public Netlify project uses this repository. Configuration is in root `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 22

Source and project documentation are never copied into the public output. Do not publish the repository root.

Netlify provides `CONTEXT` automatically. Production emits indexable public pages and a canonical sitemap. Deploy-preview, branch-deploy, and other nonproduction contexts emit `noindex` in HTML and HTTP headers with an empty sitemap. The build deliberately keeps preview crawling allowed so the noindex directives remain visible. To inspect this behavior locally:

```bash
CONTEXT=deploy-preview npm run build
# Restore the regular local production output afterward:
CONTEXT=production npm run build
```

Legacy URLs are individually mapped to the equivalent new routes; there is no catch-all SPA rewrite. The new public layout preserves the Warm Stone, navy, red, Georgia, and Aptos/Segoe UI brand direction, local image assets, and Care / Excellence / Respect values.

## General inquiries and privacy

The existing `careforvets-contact` Netlify form identity and `info@careforvets.com` public contact are retained. On November 6, 2026, Netlify reported form processing disabled for this project. Email is therefore the default public contact route. The form is a hidden static detection blueprint unless `CONTACT_FORM_ENABLED=true` is explicitly set. Enable that flag only after Netlify form detection and the receiving/notification workflow are verified. No hosting setting is changed by this branch. The HTML form has a hidden form-name field, a honeypot, required field validation, and the extensionless `/thank-you/` confirmation route. JavaScript enhances submission feedback and redirects only after a successful HTTP response.

The form asks for name, email, optional organization, broad inquiry purpose, and a general non-clinical message. It has no attachments or medical intake fields. There are no analytics scripts, advertising pixels, session replay, saved search terms, or tracking query parameters. Public resource pages use a no-referrer policy for external navigation.

## Current scope

CareForVets provides public information and welcomes general inquiries while its care-navigation and home health model develops. This release does not claim current clinical services, VA affiliation, payer approval, or a local clinical service area. Careers are informational; there are no invented vacancies or application submissions. Partner information does not activate onboarding or establish an approved relationship.

This work is separate from the authenticated BUILD v2 portal, its database connections, external-partner workflow, and draft PR #1. None of those are required for public SEO pages to render.

## Maintenance

Read [implementation mapping](docs/seo/implementation.md), [source verification](docs/seo/resource-verification.md), [validation results](docs/seo/validation.md), and the [complete SEO design specification](docs/seo/design-specification.md). Update resource check dates only after a substantive source review. Update the public content date only for meaningful content changes. Assign an operational content owner and review the initial due date in `src/config.mjs`.

Search Console access, sitemap submission, actual inquiry delivery, and field Core Web Vitals are operational checks, not conclusions from a local build. Growth targets should be based on a measured baseline and actual service capacity.

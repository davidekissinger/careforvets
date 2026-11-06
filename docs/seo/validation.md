# Public website validation

Validated November 6, 2026 on the `feat/seo-public-site-2026-11-06` implementation branch. Local runtime: Node 24.22.1, npm 11.9.0, Playwright 1.56.1 with Chromium, and axe-core via `@axe-core/playwright` 4.11.0. The committed workflow repeats the checks on Node 22.

## Results

| Check | Result |
| --- | --- |
| Production build | Passed; 19 generated HTML pages |
| Production sitemap | 17 indexable destinations; confirmation and error pages excluded |
| Official resource records | 18, with source links, access information, and actual check dates |
| Static requirements | Passed |
| Responsive page inspections | All 19 routes at 390px and 1440px |
| Browser assertions | 44 of 44 passed |
| Automated accessibility audits | 11 completed; zero reported violations |
| Unexpected external or tracking requests | Zero observed in the browser suite |
| Browser errors | Zero observed |
| Form simulation | Two intercepted synthetic POSTs; neither sent to a server |
| Default contact route after testing | Email card visible; form blueprint hidden |

The static suite verifies titles, descriptions, one H1, canonical URLs, structured-data consistency, internal links and fragment destinations, assets, sitemap entries, legacy redirects, source-only file exclusion, resource fields, and the conditional Toledo page's absence. It also builds the enabled-form variant and checks its form contract.

For deploy previews, the suite verifies `noindex` in every generated HTML page, a global `X-Robots-Tag: noindex` header, and an empty sitemap. It restores the production build with the default email contact route afterward.

The browser suite verifies navigation with a keyboard, the mobile menu and Escape focus return, image loading, horizontal overflow, in-memory search and category filters, result announcements, reset and empty states, default contact behavior, and internal destinations. Native form validation is checked only in the explicitly enabled form variant. A simulated 503 response preserves entered values and exposes an error; a simulated successful retry reaches the confirmation page. The pending state disables repeat submission and announces progress.

Representative desktop/mobile screenshots were visually reviewed for readable typography, layout, navigation, contact actions, resource details, and urgent-support prominence. Automated accessibility results are focused checks, not a claim of comprehensive accessibility certification.

## Reproduce

```bash
npm ci
npm run build
npm run test:static
npx playwright install --with-deps chromium
npm run test:browser
```

The browser suite writes `artifacts/qa/browser-report.json`, individual axe reports, and screenshots. These artifacts are gitignored. The GitHub Actions workflow uploads them on failure to support diagnosis without placing generated artifacts in source control.

## Operational limits

- Netlify reported Forms disabled for the public site on November 6, 2026. The public default is email. The optional form requires `CONTACT_FORM_ENABLED=true` and verified processing/delivery before activation. A successful local mock does not prove inbox delivery, notification, or production processing.
- The site's existing nonproduction access controls remain in place. A protected preview may require a team login.
- Local checks do not measure production field Core Web Vitals, Search Console indexation, organic traffic, or completed inquiries. Those require live operational evidence after release.
- The unpublished Toledo page, actual job vacancies, clinical availability, and approved partner/onboarding workflows retain their documented publication prerequisites.
- This branch concerns the public website. The separate portal branch, draft PR #1, database connections, and external partner onboarding are outside its scope.

See [implementation mapping](implementation.md), [resource verification](resource-verification.md), and the [complete design specification](design-specification.md) for the requirements and evidence behind the build.

import { execFileSync, spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = new URL(process.env.BASE_URL || 'http://127.0.0.1:4173');
const SITE_ORIGIN = new URL(process.env.SITE_ORIGIN || 'https://careforvets.com').origin;
const ARTIFACTS = path.join(ROOT, 'artifacts', 'qa');
const INDEXABLE_ROUTES = [
  '/', '/care-navigation/', '/caregivers/', '/resources/',
  '/resources/care-at-home/', '/resources/disability-and-rehabilitation/',
  '/resources/mental-health-support/', '/resources/veterans-benefits/',
  '/careers/', '/careers/healthcare-careers/', '/partners/', '/about/', '/contact/',
  '/editorial-standards/', '/accessibility/', '/privacy/', '/terms/',
];
const ROUTES = [...INDEXABLE_ROUTES, '/thank-you/', '/404.html'];
const AXE_ROUTES = new Set([
  '/', '/caregivers/', '/resources/', '/resources/mental-health-support/', '/contact/',
]);
const TRACKING_DOMAINS = [
  'google-analytics.com', 'analytics.google.com', 'googletagmanager.com',
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'connect.facebook.net', 'facebook.com', 'bat.bing.com', 'clarity.ms',
  'hotjar.com', 'hotjar.io', 'fullstory.com', 'segment.com', 'segment.io',
  'mixpanel.com', 'amplitude.com', 'plausible.io', 'matomo.cloud',
  'mouseflow.com', 'smartlook.com', 'analytics.tiktok.com',
];
const failures = [];
const results = [];
const browserErrors = new Set();
const blockedRequests = [];
const internalLinks = new Map();
const pageTitles = new Map();
let browser;
let server;
let serverOutput = '';
let mockedServiceFailure = false;
let successfulMockResponse = false;
let interceptedFormPosts = 0;
let axeAudits = 0;
let axeViolations = 0;

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function step(name, action) {
  const before = failures.length;
  try {
    await action();
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
  const passed = failures.length === before;
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
}

function isTrackingHost(host) {
  return TRACKING_DOMAINS.some(domain => host === domain || host.endsWith(`.${domain}`));
}

function isInternal(url) {
  return url.origin === BASE_URL.origin || url.origin === SITE_ORIGIN ||
    ['careforvets.com', 'www.careforvets.com'].includes(url.hostname);
}

async function isReady() {
  try {
    await fetch(new URL('/', BASE_URL), {
      redirect: 'manual', signal: AbortSignal.timeout(1500),
    });
    return true;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isReady()) return;
  if (process.env.BASE_URL) throw new Error(`No server is responding at ${BASE_URL.origin}`);
  server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: BASE_URL.port || '4173' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', chunk => { serverOutput = (serverOutput + chunk).slice(-6000); });
  }
  let spawnError;
  server.on('error', error => { spawnError = error; });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) throw new Error(`Local server exited: ${serverOutput}`);
    if (await isReady()) return;
    // Poll server readiness; browser assertions below wait on observable state.
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Local server did not become ready: ${serverOutput}`);
}

function buildPublic(formEnabled = false) {
  const output = execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: ROOT,
    env: { ...process.env, CONTEXT: 'production', CONTACT_FORM_ENABLED: String(formEnabled) },
    encoding: 'utf8', timeout: 30000,
  });
  console.log(output.trim());
}

async function auditPage(page, name, width) {
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  axeAudits += 1;
  axeViolations += audit.violations.length;
  await writeFile(path.join(ARTIFACTS, `axe-${name}-${width}.json`),
    JSON.stringify({ url: page.url(), viewport: width, violations: audit.violations }, null, 2));
  for (const violation of audit.violations) {
    failures.push(`${name} at ${width}px: axe ${violation.id} (${violation.impact}): ${violation.nodes.map(node => node.target.join(' ')).join('; ')}`);
  }
  if (process.env.QA_SCREENSHOTS !== '0') {
    await page.screenshot({ path: path.join(ARTIFACTS, `${name}-${width}.png`), fullPage: true, animations: 'disabled' });
  }
}

async function inspectPage(page, route, width) {
  const label = `${route} at ${width}px`;
  const response = await page.goto(new URL(route, BASE_URL).href, { waitUntil: 'load' });
  const expectedStatus = route === '/404.html' ? [200, 404] : [200];
  check(response && expectedStatus.includes(response.status()),
    `${label}: unexpected HTTP status ${response?.status()}`);
  check(new URL(page.url()).pathname === route, `${label}: unexpected redirect to ${page.url()}`);
  await page.evaluate(() => document.fonts.ready);

  const details = await page.evaluate(async () => {
    const brokenImages = (await Promise.all([...document.images].map(async image => {
      image.loading = 'eager';
      try { await image.decode(); } catch { /* Report the failed image below. */ }
      return image.complete && image.naturalWidth > 0 ? null : image.currentSrc || image.src;
    }))).filter(Boolean);
    const viewport = document.documentElement.clientWidth;
    const overflowing = [...document.querySelectorAll('body *')].filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1);
    }).slice(0, 8).map(element => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}.${String(element.className).replaceAll(' ', '.')}`);
    return {
      title: document.title.trim(),
      h1: [...document.querySelectorAll('h1')].map(element => element.textContent.trim()),
      canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(element => element.href),
      robots: [...document.querySelectorAll('meta[name="robots"]')].map(element => element.content).join(','),
      description: document.querySelector('meta[name="description"]')?.content.trim(),
      language: document.documentElement.lang,
      width: viewport,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      overflowing,
      brokenImages,
      links: [...document.querySelectorAll('a[href]')].map(element => ({
        href: element.getAttribute('href'), label: element.textContent.trim(),
      })),
    };
  });
  check(details.h1.length === 1 && details.h1[0].length > 0,
    `${label}: expected one nonempty H1, found ${JSON.stringify(details.h1)}`);
  check(details.title.length > 0, `${label}: missing title`);
  check(Boolean(details.description), `${label}: missing meta description`);
  check(details.language.startsWith('en'), `${label}: missing English document language`);
  check(details.brokenImages.length === 0, `${label}: broken images ${details.brokenImages.join(', ')}`);
  check(details.scrollWidth <= details.width + 1,
    `${label}: horizontal overflow (${details.scrollWidth}/${details.width}); ${details.overflowing.join(', ')}`);

  const expectedCanonical = new URL(route, SITE_ORIGIN).href;
  if (INDEXABLE_ROUTES.includes(route)) {
    check(details.canonical.length === 1 && details.canonical[0] === expectedCanonical,
      `${label}: expected canonical ${expectedCanonical}, found ${JSON.stringify(details.canonical)}`);
    check(!/\bnoindex\b/i.test(details.robots), `${label}: indexable page has noindex`);
    if (width === 1440) {
      const duplicate = pageTitles.get(details.title);
      check(!duplicate, `${label}: title duplicates ${duplicate}`);
      pageTitles.set(details.title, route);
    }
  } else {
    check(/\bnoindex\b/i.test(details.robots), `${label}: utility/error page needs noindex`);
    check(details.canonical.length <= 1, `${label}: multiple canonicals`);
    if (details.canonical.length) {
      check(details.canonical[0] === expectedCanonical, `${label}: canonical points to another page`);
    }
  }

  const nav = page.locator('nav#site-navigation');
  check(await nav.count() === 1, `${label}: missing primary navigation`);
  check(await page.locator('footer').count() === 1, `${label}: missing footer`);
  if (width === 1440) check(await nav.isVisible(), `${label}: desktop navigation is hidden`);
  for (const link of details.links) {
    check(Boolean(link.href?.trim()), `${label}: empty link destination (${link.label})`);
    check(!/^javascript:/i.test(link.href || ''), `${label}: JavaScript link (${link.label})`);
    if (!link.href?.trim()) continue;
    const destination = new URL(link.href, page.url());
    if (!['http:', 'https:'].includes(destination.protocol) || !isInternal(destination)) continue;
    const key = destination.pathname + destination.search + destination.hash;
    if (!internalLinks.has(key)) internalLinks.set(key, { destination, source: route });
  }

  if (AXE_ROUTES.has(route)) {
    await auditPage(page, route.replaceAll('/', '-').replace(/^-|-$/g, '') || 'home', width);
  }
}

async function inspectMobileMenu(page) {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(new URL('/', BASE_URL).href);
  const toggle = page.locator('button.menu-toggle');
  const nav = page.locator('nav#site-navigation');
  check(await toggle.isVisible(), 'Mobile menu: toggle is not visible');
  check(await toggle.getAttribute('aria-controls') === 'site-navigation', 'Mobile menu: aria-controls is incorrect');
  check(await toggle.getAttribute('aria-expanded') === 'false', 'Mobile menu: initial expanded state is incorrect');
  check(!await nav.isVisible(), 'Mobile menu: navigation should initially be collapsed');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await nav.waitFor({ state: 'visible' });
  check(await toggle.getAttribute('aria-expanded') === 'true', 'Mobile menu: open state not announced');
  await page.keyboard.press('Tab');
  check(await nav.locator('a').first().evaluate(element => element === document.activeElement),
    'Mobile menu: first link is not next in the keyboard tab order');
  await page.keyboard.press('Escape');
  await nav.waitFor({ state: 'hidden' });
  check(await toggle.getAttribute('aria-expanded') === 'false', 'Mobile menu: Escape did not update expanded state');
  check(await toggle.evaluate(element => element === document.activeElement), 'Mobile menu: Escape did not return focus');
  await page.keyboard.press('Space');
  await nav.waitFor({ state: 'visible' });
  const resourceLink = nav.locator('a[href="/resources/"]');
  await resourceLink.click();
  await page.waitForURL(new URL('/resources/', BASE_URL).href);
  check(await page.locator('button.menu-toggle').getAttribute('aria-expanded') === 'false',
    'Mobile menu: navigation after a link click should be collapsed');
}

async function waitForResources(page, count) {
  await page.waitForFunction(expected => {
    return [...document.querySelectorAll('[data-resource-card]')]
      .filter(element => element.getClientRects().length > 0).length === expected;
  }, count);
  const countText = await page.locator('#resource-count').innerText();
  check(new RegExp(`\\b${count}\\b`).test(countText),
    `Resources: announced count does not match ${count}: ${countText}`);
  check(await page.locator('#resource-empty').isVisible() === (count === 0),
    `Resources: empty state does not match ${count} visible results`);
}

async function inspectResources(page) {
  await page.goto(new URL('/resources/', BASE_URL).href);
  const initialURL = page.url();
  const search = page.locator('#resource-search');
  const category = page.locator('#resource-category');
  const reset = page.locator('#resource-reset');
  check(await search.count() === 1 && await category.count() === 1 && await reset.count() === 1,
    'Resources: search, category, or reset control is missing');
  check(['polite', 'assertive'].includes(await page.locator('#resource-count').getAttribute('aria-live')),
    'Resources: count is not announced through aria-live');
  const cards = await page.locator('[data-resource-card]').evaluateAll(elements => elements.map(element => ({
    categories: (element.dataset.category || '').split(/\s+/),
    title: element.querySelector('h2,h3,h4')?.textContent.trim(),
  })));
  check(cards.length > 0, 'Resources: no resource cards rendered');
  await waitForResources(page, cards.length);
  for (const value of ['care-at-home', 'caregivers', 'disability', 'mental-health', 'benefits', 'careers']) {
    await category.selectOption(value);
    await waitForResources(page, cards.filter(card => card.categories.includes(value)).length);
    const visibleCategories = await page.locator('[data-resource-card]:visible').evaluateAll(elements =>
      elements.map(element => (element.dataset.category || '').split(/\s+/)));
    check(visibleCategories.every(categories => categories.includes(value)), `Resources: ${value} filter shows unrelated cards`);
  }
  await reset.click();
  await waitForResources(page, cards.length);
  const firstTitle = cards.find(card => card.title)?.title;
  check(Boolean(firstTitle), 'Resources: cards have no headings to search');
  if (firstTitle) {
    await search.fill(firstTitle);
    await page.waitForFunction(title => [...document.querySelectorAll('[data-resource-card]')]
      .some(element => element.getClientRects().length > 0 && element.textContent.includes(title)), firstTitle);
    check(await page.locator('[data-resource-card]:visible').count() > 0, 'Resources: matching search returned no results');
  }
  await search.fill('qa-no-matching-resource-9f4cba');
  await waitForResources(page, 0);
  await reset.click();
  await waitForResources(page, cards.length);
  check(await search.inputValue() === '', 'Resources: reset did not clear search');
  check(await category.inputValue() === 'all', 'Resources: reset did not restore all categories');
  check(page.url() === initialURL, 'Resources: filtering unexpectedly changed the URL');
}

async function inspectContact(page, enabled = false) {
  await page.goto(new URL('/contact/', BASE_URL).href);
  const initialURL = page.url();
  const form = page.locator(enabled ? 'form#general-inquiry' : 'form#contact-form-blueprint');
  const attributes = await form.evaluate(element => ({
    name: element.getAttribute('name'),
    method: element.getAttribute('method')?.toLowerCase(),
    netlify: element.getAttribute('data-netlify'),
    honeypot: element.getAttribute('netlify-honeypot'),
    action: element.getAttribute('action'),
    noValidate: element.noValidate,
    required: element.querySelectorAll('[required]').length,
    valid: element.checkValidity(),
    hiddenName: element.querySelector('input[name="form-name"]')?.value,
  }));
  check(attributes.name === 'careforvets-contact' && attributes.hiddenName === attributes.name,
    'Contact: Netlify form names do not match');
  check(attributes.method === 'post' && attributes.netlify === 'true', 'Contact: Netlify POST form attributes are missing');
  check(attributes.action === '/thank-you/', 'Contact: form action must be /thank-you/');
  check(Boolean(attributes.honeypot), 'Contact: honeypot attribute is missing');
  if (attributes.honeypot) {
    const honeypot = await form.locator('input').evaluateAll((inputs, name) => {
      const field = inputs.find(input => input.name === name);
      return { exists: Boolean(field), hidden: field?.getClientRects().length === 0 };
    }, attributes.honeypot);
    check(honeypot.exists && honeypot.hidden, 'Contact: named honeypot field is missing or visible');
  }
  check(!attributes.noValidate && attributes.required > 0 && !attributes.valid,
    'Contact: empty form is not protected by native required-field validation');
  if (!enabled) {
    check(!await form.isVisible(), 'Contact: disabled form blueprint is visible');
    check(await page.locator('form:visible').count() === 0, 'Contact: a submission form is exposed before service enablement');
    check(await page.locator('div#general-inquiry').isVisible(), 'Contact: default email card is not visible');
    check(await page.locator('div#general-inquiry a[href="mailto:info@careforvets.com"]').first().isVisible(),
      'Contact: default email action is missing');
    check(await page.locator('.form-status').count() === 0, 'Contact: hidden blueprint must not receive submission behavior');
    return;
  }
  check(await form.isVisible(), 'Contact: explicitly enabled form is hidden');
  await form.evaluate(element => {
    window.__qaForm = { invalid: 0, submitted: 0 };
    element.addEventListener('invalid', () => { window.__qaForm.invalid += 1; }, true);
    window.__qaValidationGuard = event => {
      window.__qaForm.submitted += 1;
      event.preventDefault();
    };
    element.addEventListener('submit', window.__qaValidationGuard, true);
  });
  await form.locator('button[type="submit"], input[type="submit"]').first().click();
  const validation = await page.evaluate(() => window.__qaForm);
  check(validation.invalid > 0 && validation.submitted === 0,
    'Contact: empty submit did not stop at native browser validation');
  check(page.url() === initialURL, 'Contact: invalid submit left the contact page');
  await form.evaluate(element => element.removeEventListener('submit', window.__qaValidationGuard, true));
}

async function inspectEnabledForm(page) {
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(BASE_URL.hostname)) {
    throw new Error('Enabled-form simulation requires a local BASE_URL serving this checkout');
  }
  const mockURL = new URL('/thank-you/', BASE_URL).href;
  let releaseFailure;
  const failureGate = new Promise(resolve => { releaseFailure = resolve; });
  let attempts = 0;
  const mockHandler = async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    attempts += 1;
    interceptedFormPosts += 1;
    const body = new URLSearchParams(route.request().postData() || '');
    check(body.get('form-name') === 'careforvets-contact', 'Enabled form: missing encoded Netlify form name');
    check(body.get('email') === 'qa@example.invalid', 'Enabled form: mock payload differs from synthetic test data');
    if (attempts === 1) {
      await failureGate;
      mockedServiceFailure = true;
      await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Local QA simulated service failure.' });
    } else if (attempts === 2) {
      successfulMockResponse = true;
      await route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    } else {
      failures.push('Enabled form: unexpected additional POST attempt');
      await route.abort('blockedbyclient');
    }
  };
  try {
    buildPublic(true);
    await page.route(mockURL, mockHandler);
    await inspectContact(page, true);
    await auditPage(page, 'contact-enabled', page.viewportSize().width);
    const form = page.locator('form#general-inquiry');
    const submit = form.locator('button[type="submit"]');
    const status = form.locator('.form-status');
    const values = {
      name: 'QA Example', email: 'qa@example.invalid', organization: 'Local QA',
      purpose: 'General information',
      message: 'Local automated form verification. No message is being transmitted.',
    };
    for (const [field, value] of Object.entries(values)) {
      if (field === 'purpose') await form.locator(`[name="${field}"]`).selectOption(value);
      else await form.locator(`[name="${field}"]`).fill(value);
    }
    const firstRequest = page.waitForRequest(request => request.url() === mockURL && request.method() === 'POST');
    await submit.click();
    await firstRequest;
    check(await submit.isDisabled() && await submit.getAttribute('aria-busy') === 'true',
      'Enabled form: pending submission does not disable and announce the button');
    check(await status.isVisible() && /sending/i.test(await status.innerText()), 'Enabled form: pending status is missing');
    releaseFailure();
    await form.locator('.form-status.is-error').waitFor({ state: 'visible' });
    check(new URL(page.url()).pathname === '/contact/', 'Enabled form: failed submission navigated away');
    check(/could not confirm delivery/i.test(await status.innerText()), 'Enabled form: failure feedback is missing');
    check(!await submit.isDisabled() && await submit.getAttribute('aria-busy') !== 'true', 'Enabled form: retry is unavailable after failure');
    for (const [field, value] of Object.entries(values)) {
      check(await form.locator(`[name="${field}"]`).inputValue() === value, `Enabled form: failed submission lost ${field}`);
    }
    check(await status.locator('a[href="mailto:info@careforvets.com"]').isVisible(), 'Enabled form: failure state lacks the email fallback');
    if (process.env.QA_SCREENSHOTS !== '0') {
      await page.screenshot({ path: path.join(ARTIFACTS, 'contact-enabled-error-390.png'), fullPage: true, animations: 'disabled' });
    }
    await submit.click();
    await page.waitForURL(mockURL);
    check(attempts === 2, `Enabled form: expected two intercepted POSTs, observed ${attempts}`);
    check(await page.locator('h1').innerText() === 'Thank You for Getting in Touch', 'Enabled form: confirmed response did not reach the confirmation page');
  } finally {
    releaseFailure();
    await page.unroute(mockURL, mockHandler);
    buildPublic(false);
    await inspectContact(page);
  }
}

async function inspectInternalLinks(context) {
  const cache = new Map();
  for (const { destination, source } of internalLinks.values()) {
    const pathAndQuery = destination.pathname + destination.search;
    if (!cache.has(pathAndQuery)) {
      let localURL = new URL(pathAndQuery, BASE_URL);
      let response;
      let settled = false;
      for (let redirect = 0; redirect <= 5; redirect += 1) {
        response = await context.request.get(localURL.href, { maxRedirects: 0 });
        if (![301, 302, 303, 307, 308].includes(response.status())) {
          settled = true;
          break;
        }
        const location = response.headers().location;
        if (!location) break;
        const next = new URL(location, localURL);
        if (!isInternal(next)) {
          failures.push(`Internal link ${pathAndQuery} redirects outside the site to ${next.href} (from ${source})`);
          break;
        }
        localURL = new URL(next.pathname + next.search, BASE_URL);
      }
      const status = response?.status();
      // The real error page must return 404; its own skip-link still needs a valid anchor.
      const expectedErrorPage = pathAndQuery === '/404.html' && source === '/404.html' && status === 404;
      check(settled && ((status >= 200 && status < 300) || expectedErrorPage),
        `Internal link ${pathAndQuery} does not resolve successfully (${status}; from ${source})`);
      const html = response?.headers()['content-type']?.includes('text/html') ? await response.text() : '';
      const anchors = new Set([...html.matchAll(/\b(?:id|name)\s*=\s*(["'])(.*?)\1/gi)].map(match => match[2]));
      cache.set(pathAndQuery, { status, anchors });
      await response?.dispose();
    }
    if (destination.hash && destination.hash !== '#') {
      const anchor = decodeURIComponent(destination.hash.slice(1));
      check(cache.get(pathAndQuery).anchors.has(anchor),
        `Internal anchor ${pathAndQuery}${destination.hash} is missing (from ${source})`);
    }
  }
}

try {
  await mkdir(ARTIFACTS, { recursive: true });
  buildPublic(false);
  await ensureServer();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce', locale: 'en-US', serviceWorkers: 'block',
  });
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const unsafeMethod = !['GET', 'HEAD'].includes(request.method());
    const tracking = isTrackingHost(url.hostname);
    const external = ['http:', 'https:'].includes(url.protocol) && url.origin !== BASE_URL.origin;
    if (unsafeMethod || tracking || external) {
      blockedRequests.push({ method: request.method(), url: url.href, unsafeMethod, tracking, external });
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => browserErrors.add(`${page.url()}: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    // A deliberately requested HTTP 404 can produce a browser-level console error.
    const source = message.location().url;
    let sourcePath;
    try { sourcePath = new URL(source).pathname; } catch { /* Evaluation scripts need not have a URL. */ }
    if (sourcePath === '/404.html' && /\b404\b/.test(message.text())) return;
    if (mockedServiceFailure && sourcePath === '/thank-you/' && /\b503\b/.test(message.text())) return;
    browserErrors.add(`${source || page.url()}: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    const error = request.failure()?.errorText;
    // Navigating after a mocked successful fetch may abort its unread body.
    // The separate assertion still requires arrival at the confirmation page.
    if (successfulMockResponse && request.method() === 'POST' &&
        request.url() === new URL('/thank-you/', BASE_URL).href && error === 'net::ERR_ABORTED') return;
    browserErrors.add(`${page.url()}: request failed ${request.method()} ${request.url()} (${error}; ${request.resourceType()})`);
  });

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 900 : 1000 });
    for (const route of ROUTES) {
      await step(`${route} (${width}px)`, () => inspectPage(page, route, width));
    }
  }
  await step('Mobile menu keyboard and navigation behavior', () => inspectMobileMenu(page));
  await step('Resource search, filters, empty state, and reset', () => inspectResources(page));
  await step('Default contact email route and hidden form detection blueprint', () => inspectContact(page));
  await step('Internal links and fragment destinations', () => inspectInternalLinks(context));
  await step('Enabled form native validation, pending state, mocked failure/retry/success', () => inspectEnabledForm(page));
  await step('Browser errors and private browsing behavior', async () => {
    for (const error of browserErrors) failures.push(`Browser error: ${error}`);
    for (const request of blockedRequests) {
      failures.push(`Blocked unexpected ${request.tracking ? 'tracking ' : ''}${request.external ? 'external ' : ''}request: ${request.method} ${request.url}`);
    }
  });
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  try {
    buildPublic(false);
    const contact = await readFile(path.join(ROOT, 'dist/contact/index.html'), 'utf8');
    check(/<div\b[^>]*id="general-inquiry"/.test(contact) && /<form\b[^>]*id="contact-form-blueprint"[^>]*\bhidden\b/.test(contact),
      'Final restoration: default email route and hidden blueprint were not restored');
  } catch (error) {
    failures.push(`Final restoration failed: ${error.message}`);
  }
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise(resolve => {
      const timeout = setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 2000);
      server.once('exit', () => { clearTimeout(timeout); resolve(); });
    });
  }
  await mkdir(ARTIFACTS, { recursive: true });
  await writeFile(path.join(ARTIFACTS, 'browser-report.json'), JSON.stringify({
    baseURL: BASE_URL.href,
    indexableRoutes: INDEXABLE_ROUTES.length,
    utilityRoutes: ROUTES.length - INDEXABLE_ROUTES.length,
    results, failures, blockedRequests, axeAudits, axeViolations, interceptedFormPosts,
    defaultContactRestored: failures.every(failure => !failure.startsWith('Final restoration')),
    note: 'Focused automated checks supplement manual accessibility and production field-performance review. Two synthetic form POSTs are fulfilled entirely inside the browser; no form is transmitted to a server.',
  }, null, 2));
}

if (failures.length) {
  console.error(`\n${failures.length} browser QA issue(s):\n${failures.map(failure => `- ${failure}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`\nBrowser QA passed: ${INDEXABLE_ROUTES.length} indexable routes and 2 utility/error pages at 390px and 1440px.`);
}

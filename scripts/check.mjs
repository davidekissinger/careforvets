import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, conditionalPages, legacyRedirects, site } from '../src/config.mjs';
import { primaryPages } from '../src/content/primary-pages.mjs';
import { secondaryPages } from '../src/content/secondary-pages.mjs';
import { resources } from '../src/content/resources.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const pages = [...primaryPages, ...secondaryPages];
const expectedIndexable = [
  '/', '/care-navigation/', '/caregivers/', '/resources/',
  '/resources/care-at-home/', '/resources/disability-and-rehabilitation/',
  '/resources/mental-health-support/', '/resources/veterans-benefits/',
  '/careers/', '/careers/healthcare-careers/', '/partners/', '/about/', '/contact/',
  '/editorial-standards/', '/accessibility/', '/privacy/', '/terms/',
];
const expectedUtility = ['/thank-you/', '/404.html'];
const expectedCategories = ['care-at-home', 'caregivers', 'disability', 'mental-health', 'benefits', 'careers'];
const requiredRedirects = [
  ['/home', '/'], ['/index.html', '/'],
  ['/veterans.html', '/care-navigation/'], ['/veterans', '/care-navigation/'],
  ['/home-health.html', '/resources/care-at-home/'], ['/home-health', '/resources/care-at-home/'],
  ['/partners.html', '/partners/'], ['/about.html', '/about/'],
  ['/contact.html', '/contact/'], ['/privacy.html', '/privacy/'], ['/terms.html', '/terms/'],
  ['/success.html', '/thank-you/'], ['/success', '/thank-you/'],
];
const approvedResourceDomains = [
  'va.gov', 'caregiveraction.org', 'hiddenheroes.org', 'dav.org', 'pva.org',
  'msktc.org', 'biausa.org', 'maketheconnection.net', 'veteranscrisisline.net',
  'woundedwarriorproject.org',
];
const failures = [];

function decode(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rarr: '→' };
  return String(value).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|rarr);/gi, (entity, key) => {
    if (key.startsWith('#')) {
      const hex = key[1].toLowerCase() === 'x';
      return String.fromCodePoint(Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    return named[key.toLowerCase()] || entity;
  });
}

function attributes(value) {
  const result = {};
  for (const match of value.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))]
    .map(match => attributes(match[1]));
}

function blocks(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, 'gi'))]
    .map(match => ({ attributes: attributes(match[1]), body: match[2] }));
}

function text(html) {
  return decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[^]*?-->/g, '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizedHeading(value) {
  return text(value).toLowerCase().replace(/[.!?]+$/, '');
}

function routeFile(route) {
  return route === '/' ? 'index.html' : route.endsWith('.html') ? route.slice(1) : `${route.slice(1)}index.html`;
}

function unique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

function sameSet(actual, expected, message) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), message);
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

async function section(name, action) {
  try {
    await action();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

function build(context, formEnabled = false) {
  const output = execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: ROOT,
    env: { ...process.env, CONTEXT: context, CONTACT_FORM_ENABLED: String(formEnabled) },
    encoding: 'utf8', timeout: 30000,
  });
  console.log(output.trim());
}

async function readPages() {
  return new Map(await Promise.all(pages.map(async page => [page.path, await readFile(path.join(DIST, routeFile(page.path)), 'utf8')])));
}

async function listFiles(directory = DIST, relative = '') {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    assert(!entry.isSymbolicLink(), `Published output cannot contain symlinks: ${name}`);
    assert(!entry.name.startsWith('.'), `Hidden file or directory in published output: ${name}`);
    assert(!/^(?:src|docs|scripts|tests|node_modules|portal|private|supabase)(?:\/|$)/.test(name),
      `Source or private directory in published output: ${name}`);
    if (entry.isDirectory()) output.push(...await listFiles(path.join(directory, entry.name), name));
    else output.push(name);
  }
  return output;
}

async function assertLocalAsset(value, baseURL, source) {
  if (value.startsWith('data:')) return;
  const url = new URL(value, baseURL);
  assert.equal(url.origin, site.origin, `${source}: asset must be hosted on CareForVets (${value})`);
  const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
  const destination = path.resolve(DIST, relative);
  assert(destination.startsWith(DIST + path.sep), `${source}: asset escapes published directory`);
  assert((await stat(destination)).isFile(), `${source}: missing asset ${url.pathname}`);
}

function headerBlocks(raw) {
  const result = new Map();
  let current;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = line.trim();
      result.set(current, {});
    } else {
      const separator = line.indexOf(':');
      assert(current && separator > 0, 'Invalid generated _headers syntax');
      result.get(current)[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
    }
  }
  return result;
}

function checkSources() {
  assert.equal(site.origin, 'https://careforvets.com', 'Production origin must remain the verified canonical origin');
  assert(validDate(site.contentDate), 'Content review date must be a real ISO date');
  assert.equal(pages.length, 19, 'Expected 19 published routes');
  sameSet(pages.filter(page => !page.noindex).map(page => page.path), expectedIndexable, 'Indexable route set changed');
  sameSet(pages.filter(page => page.noindex).map(page => page.path), expectedUtility, 'Utility route set changed');
  for (const field of ['path', 'title', 'description', 'h1']) {
    for (const page of pages) assert(typeof page[field] === 'string' && page[field].trim(), `${page.path}: missing ${field}`);
    unique(pages.map(page => page[field].trim()), `Page ${field} values`);
  }
  for (const page of pages) {
    assert(page.path.startsWith('/') && !page.path.includes('?') && !page.path.includes('#'), `${page.path}: invalid route`);
    assert(page.path === '/404.html' || page.path.endsWith('/'), `${page.path}: route must end in a slash`);
    assert(page.body?.trim(), `${page.path}: public body content is missing`);
    if (page.resourceCategories) {
      assert(page.resourceCategories.length > 0 && page.resourceCategories.every(id => expectedCategories.includes(id)), `${page.path}: unknown resource category`);
    }
  }
  assert(conditionalPages.some(page => page.path === '/locations/toledo-oh/'), 'Conditional Toledo draft must stay recorded');
  for (const draft of conditionalPages) assert(!pages.some(page => page.path === draft.path), `${draft.path}: unverified conditional page is published`);
  sameSet(categories.map(category => category.id), expectedCategories, 'Resource category definitions changed');
}

function checkResources(htmlPages) {
  assert.equal(resources.length, 18, 'Expected 18 reviewed resource records');
  unique(resources.map(resource => resource.id), 'Resource IDs');
  const library = htmlPages.get('/resources/');
  const rendered = tags(library, 'article').filter(tag => 'data-resource-card' in tag);
  assert.equal(rendered.length, resources.length, 'All records must be rendered without JavaScript');
  for (const resource of resources) {
    for (const field of ['id', 'name', 'summary', 'audience', 'geography', 'access', 'checked', 'url', 'sourceUrl']) {
      assert(typeof resource[field] === 'string' && resource[field].trim(), `${resource.id}: missing ${field}`);
    }
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource.id), `${resource.id}: unsafe resource identifier`);
    assert(resource.categories.length > 0 && resource.categories.every(id => expectedCategories.includes(id)), `${resource.id}: unapproved category`);
    unique(resource.categories, `${resource.id} categories`);
    assert(validDate(resource.checked) && resource.checked <= site.contentDate, `${resource.id}: invalid or unreviewed future source-check date`);
    for (const field of ['url', 'sourceUrl']) {
      const url = new URL(resource[field]);
      assert(url.protocol === 'https:' && !url.username && !url.password, `${resource.id}: invalid ${field}`);
      assert(approvedResourceDomains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)), `${resource.id}: ${field} needs source review`);
      assert(![...url.searchParams.keys()].some(key => /^(utm_|gclid$|fbclid$)/i.test(key)), `${resource.id}: tracking parameters in ${field}`);
      assert(tags(library, 'a').some(anchor => anchor.href === resource[field]), `${resource.id}: ${field} is not visible as a public link`);
    }
    assert(rendered.some(card => card.id === `resource-${resource.id}`), `${resource.id}: missing public card`);
    assert(text(library).includes(resource.name), `${resource.id}: resource name is not visible`);
    assert(tags(library, 'time').some(time => time.datetime === resource.checked), `${resource.id}: source-check date is not rendered`);
  }
}

async function checkRenderedPages(htmlPages) {
  for (const page of pages) {
    const html = htmlPages.get(page.path);
    const title = blocks(html, 'title');
    const h1 = blocks(html, 'h1');
    const meta = tags(html, 'meta');
    const descriptions = meta.filter(tag => tag.name === 'description');
    const canonicals = tags(html, 'link').filter(tag => tag.rel === 'canonical');
    assert.equal(title.length, 1, `${page.path}: expected one title`);
    assert.equal(text(title[0].body), page.title, `${page.path}: title differs from source metadata`);
    assert.equal(h1.length, 1, `${page.path}: expected one H1`);
    assert.equal(normalizedHeading(h1[0].body), normalizedHeading(page.h1), `${page.path}: H1 differs from source metadata`);
    assert.equal(descriptions.length, 1, `${page.path}: expected one description`);
    assert.equal(descriptions[0].content, page.description, `${page.path}: description differs from source metadata`);
    assert.equal(canonicals.length, 1, `${page.path}: expected one canonical`);
    assert.equal(canonicals[0].href, site.origin + page.path, `${page.path}: incorrect canonical`);
    assert.equal(meta.find(tag => tag.property === 'og:url')?.content, site.origin + page.path, `${page.path}: incorrect social URL`);
    assert.equal(tags(html, 'html')[0]?.lang, 'en', `${page.path}: document language is missing`);
    assert.equal(blocks(html, 'main').length, 1, `${page.path}: expected one main landmark`);
    assert(!/<iframe\b|<object\b|<embed\b/i.test(html), `${page.path}: unexpected third-party/embed surface`);
    unique([...html.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map(match => match[1]), `${page.path} HTML IDs`);
    const base = site.origin + page.path;
    for (const tag of tags(html, 'script').filter(tag => tag.src)) await assertLocalAsset(tag.src, base, page.path);
    for (const tag of tags(html, 'link').filter(tag => ['stylesheet', 'icon', 'preload'].includes(tag.rel))) await assertLocalAsset(tag.href, base, page.path);
    for (const tag of tags(html, 'img')) {
      assert('alt' in tag, `${page.path}: image is missing alt text`);
      assert(Number(tag.width) > 0 && Number(tag.height) > 0, `${page.path}: image needs dimensions`);
      await assertLocalAsset(tag.src, base, page.path);
    }
    for (const tag of meta.filter(tag => tag.property === 'og:image' || tag.name === 'twitter:image')) await assertLocalAsset(tag.content, base, page.path);
  }
  const css = await readFile(path.join(DIST, 'assets/styles.css'), 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) await assertLocalAsset(match[1], `${site.origin}/assets/styles.css`, 'styles.css');
}

function checkLinks(htmlPages) {
  const pagePaths = new Set(pages.map(page => page.path));
  const aliases = new Map(legacyRedirects);
  for (const [route, html] of htmlPages) {
    for (const anchor of tags(html, 'a')) {
      assert(anchor.href?.trim() && anchor.href !== '#', `${route}: empty or placeholder link`);
      const url = new URL(anchor.href, site.origin + route);
      assert(['https:', 'http:', 'mailto:', 'tel:', 'sms:'].includes(url.protocol), `${route}: unsupported link scheme ${url.protocol}`);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      if (url.hostname !== 'careforvets.com' && url.hostname !== 'www.careforvets.com') continue;
      const destination = aliases.get(url.pathname) || url.pathname;
      assert(pagePaths.has(destination), `${route}: missing internal destination ${url.pathname}`);
      assert(!conditionalPages.some(draft => draft.path === destination), `${route}: link points at an unpublished location page`);
      if (url.hash) {
        const ids = [...htmlPages.get(destination).matchAll(/\b(?:id|name)\s*=\s*(["'])(.*?)\1/g)].map(match => decode(match[2]));
        assert(ids.includes(decodeURIComponent(url.hash.slice(1))), `${route}: broken fragment ${url.pathname}${url.hash}`);
      }
    }
  }
}

function checkSchema(htmlPages) {
  for (const [route, html] of htmlPages) {
    const schemas = blocks(html, 'script').filter(block => block.attributes.type === 'application/ld+json').map(block => JSON.parse(block.body));
    const visible = text(html);
    for (const schema of schemas) {
      assert.equal(schema['@context'], 'https://schema.org', `${route}: incorrect schema context`);
      assert(['Organization', 'BreadcrumbList'].includes(schema['@type']), `${route}: unsupported structured-data type ${schema['@type']}`);
      const nestedTypes = JSON.stringify(schema).matchAll(/"@type"\s*:\s*"([^"]+)"/g);
      for (const type of nestedTypes) assert(['Organization', 'BreadcrumbList', 'ListItem'].includes(type[1]), `${route}: unapproved nested schema type ${type[1]}`);
      if (schema['@type'] === 'Organization') {
        assert(['/', '/about/'].includes(route), `${route}: operator schema is on an unexpected page`);
        assert.equal(schema.name, site.name, `${route}: operator name differs from visible identity`);
        assert(visible.includes(schema.name), `${route}: operator name is not visible`);
        assert.equal(schema.url, site.origin, `${route}: incorrect organization URL`);
        assert.equal(schema.email, site.email, `${route}: incorrect organization email`);
        assert(tags(html, 'a').some(anchor => anchor.href === `mailto:${schema.email}`), `${route}: organization contact is not public`);
        assert(tags(html, 'img').some(image => new URL(image.src, site.origin).href === schema.logo), `${route}: organization logo is not visible`);
      } else {
        assert(!expectedUtility.includes(route), `${route}: utility page should not advertise breadcrumbs in structured data`);
        const crumbs = schema.itemListElement;
        assert(Array.isArray(crumbs) && crumbs.length >= 2, `${route}: incomplete BreadcrumbList`);
        const breadcrumb = blocks(html, 'nav').find(block => block.attributes['aria-label'] === 'Breadcrumb');
        assert(breadcrumb, `${route}: no visible breadcrumb navigation`);
        for (const [index, crumb] of crumbs.entries()) {
          assert.equal(crumb['@type'], 'ListItem', `${route}: invalid breadcrumb item type`);
          assert.equal(crumb.position, index + 1, `${route}: breadcrumb positions must be sequential`);
          assert(text(breadcrumb.body).includes(crumb.name), `${route}: breadcrumb label is not visible`);
          assert(expectedIndexable.some(destination => site.origin + destination === crumb.item), `${route}: breadcrumb points to an unknown canonical page`);
        }
        assert.equal(crumbs[0].item, site.origin + '/', `${route}: breadcrumb must start at home`);
        assert.equal(crumbs.at(-1).item, site.origin + route, `${route}: breadcrumb must end at the current page`);
      }
    }
    if (route === '/' || route === '/about/') assert(schemas.some(schema => schema['@type'] === 'Organization'), `${route}: organization identity schema is missing`);
    if (expectedIndexable.includes(route) && route !== '/') assert(schemas.some(schema => schema['@type'] === 'BreadcrumbList'), `${route}: breadcrumb schema is missing`);
  }
}

function checkForm(htmlPages, enabled = false) {
  const forms = [...htmlPages].flatMap(([route, html]) => blocks(html, 'form').map(form => ({ route, ...form })));
  assert.equal(forms.length, 1, 'Expected one general inquiry form across the site');
  const form = forms[0];
  assert.equal(form.route, '/contact/', 'Form must only appear on the contact page');
  const attrs = form.attributes;
  assert.equal(attrs.id, enabled ? 'general-inquiry' : 'contact-form-blueprint');
  assert.equal('hidden' in attrs, !enabled, 'Detection blueprint must stay hidden; enabled form must be visible');
  const emailRoute = tags(htmlPages.get('/contact/'), 'div').find(tag => tag.id === 'general-inquiry');
  if (!enabled) {
    assert(emailRoute && !('hidden' in emailRoute), 'Default contact route must be a visible email card');
    assert(tags(htmlPages.get('/contact/'), 'a').some(anchor => anchor.href === `mailto:${site.email}`), 'Default contact email route is missing');
  }
  assert.equal(attrs.name, 'careforvets-contact');
  assert.equal(attrs.method?.toLowerCase(), 'post');
  assert.equal(attrs['data-netlify'], 'true');
  assert.equal(attrs['netlify-honeypot'], 'bot-field');
  assert.equal(attrs.action, '/thank-you/');
  assert(!('novalidate' in attrs), 'Native validation must be enabled');
  const fields = [...tags(form.body, 'input'), ...tags(form.body, 'select'), ...tags(form.body, 'textarea')];
  sameSet(fields.map(field => field.name), ['form-name', 'bot-field', 'name', 'email', 'organization', 'purpose', 'message'], 'General inquiry fields changed; review data minimization and privacy notice');
  const hiddenName = fields.find(field => field.name === 'form-name');
  assert(hiddenName.type === 'hidden' && hiddenName.value === attrs.name, 'Hidden Netlify form name must match');
  assert(blocks(form.body, 'p').some(block => 'hidden' in block.attributes && tags(block.body, 'input').some(field => field.name === attrs['netlify-honeypot'])), 'Honeypot must remain hidden');
  const labels = tags(form.body, 'label');
  for (const field of fields.filter(field => !['form-name', 'bot-field'].includes(field.name))) {
    assert(field.id && labels.some(label => label.for === field.id), `${field.name}: form control needs a visible associated label`);
    if (field.name !== 'organization') assert('required' in field, `${field.name}: required field no longer validates natively`);
  }
  assert.equal(fields.find(field => field.name === 'email').type, 'email');
  assert(tags(form.body, 'a').some(anchor => anchor.href === '/privacy/'), 'Form must link to its privacy notice');
  assert(/Do not include personal health or benefits details/.test(text(form.body)), 'General inquiry privacy instructions are missing');
}

async function checkRedirects() {
  unique(legacyRedirects.map(([from]) => from), 'Legacy redirect sources');
  for (const [from, to] of requiredRedirects) assert(legacyRedirects.some(([source, destination]) => source === from && destination === to), `Legacy URL ${from} lost its equivalent destination`);
  const raw = await readFile(path.join(DIST, '_redirects'), 'utf8');
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => line.split(/\s+/));
  for (const [from, to] of legacyRedirects) {
    assert(pages.some(page => page.path === to), `${from}: redirect does not land on a published page`);
    assert(!legacyRedirects.some(([source]) => source === to), `${from}: redirect introduces a chain`);
    assert(lines.some(line => line[0] === from && line[1] === to && line[2] === '301!'), `${from}: missing permanent generated redirect`);
  }
  assert(lines.some(line => line[0] === 'https://www.careforvets.com/*' && line[1] === `${site.origin}/:splat` && line[2] === '301!'), 'www canonical host redirect is missing');
  assert.equal(lines.length, legacyRedirects.length + 1, 'Unexpected redirect rule; verify no broad fallback or portal rule was introduced');
}

async function checkOutputIsolation() {
  const files = await listFiles();
  const expectedHTML = pages.map(page => routeFile(page.path));
  sameSet(files.filter(file => file.endsWith('.html')), expectedHTML, 'Published HTML differs from the approved route manifest');
  const metadata = new Set(['sitemap.xml', 'robots.txt', '_redirects', '_headers']);
  for (const file of files) {
    const allowedAsset = ['assets/styles.css', 'assets/site.js', 'assets/veterans-day.css', 'assets/veterans-day.js'].includes(file) ||
      /^assets\/images\/[a-z\d._/-]+\.(?:png|webp|jpg|jpeg|gif|svg|ico)$/i.test(file) ||
      /^assets\/fonts\/[a-z\d._/-]+\.(?:woff2?|ttf|otf)$/i.test(file);
    assert(expectedHTML.includes(file) || metadata.has(file) || allowedAsset,
      `Unexpected published file ${file}; source, documents, credentials, and private data must stay outside dist`);
  }
  const netlify = await readFile(path.join(ROOT, 'netlify.toml'), 'utf8');
  assert(/publish\s*=\s*"dist"/.test(netlify), 'Netlify must publish only dist');
  assert(/command\s*=\s*"npm run build"/.test(netlify), 'Netlify must build the public output');
  for (const draft of conditionalPages) assert(!files.includes(routeFile(draft.path)), `${draft.path}: conditional page leaked into output`);
}

async function checkIndexing(preview) {
  const htmlPages = await readPages();
  for (const page of pages) {
    const robots = tags(htmlPages.get(page.path), 'meta').filter(tag => tag.name === 'robots');
    assert.equal(robots.length, 1, `${page.path}: expected one robots directive`);
    assert.equal(/\bnoindex\b/i.test(robots[0].content), preview || Boolean(page.noindex), `${page.path}: incorrect ${preview ? 'preview' : 'production'} indexing directive`);
    assert.equal(tags(htmlPages.get(page.path), 'link').find(tag => tag.rel === 'canonical')?.href, site.origin + page.path, `${page.path}: canonical changed with deploy context`);
  }
  const sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
  const locations = blocks(sitemap, 'loc').map(block => decode(block.body.trim()));
  sameSet(locations, preview ? [] : expectedIndexable.map(route => site.origin + route), 'Sitemap must contain exactly the permitted canonical URLs');
  unique(locations, 'Sitemap locations');
  if (!preview) assert(blocks(sitemap, 'lastmod').every(block => block.body.trim() === site.contentDate), 'Sitemap lastmod must use the content review date');
  const robots = await readFile(path.join(DIST, 'robots.txt'), 'utf8');
  assert(!/^Disallow:\s*\/\s*$/mi.test(robots), 'Crawlers must be able to read noindex directives');
  assert.equal(/^Sitemap:/mi.test(robots), !preview, 'Preview robots.txt must not advertise the production sitemap');
  if (!preview) assert(robots.includes(`Sitemap: ${site.origin}/sitemap.xml`), 'Production sitemap discovery is missing');
  const headers = headerBlocks(await readFile(path.join(DIST, '_headers'), 'utf8'));
  const globalRobots = headers.get('/*')?.['x-robots-tag'] || '';
  assert.equal(/\bnoindex\b/i.test(globalRobots), preview, 'Global HTTP noindex must apply only to preview builds');
  if (!preview) {
    for (const [pattern, values] of headers) {
      if (/\bnoindex\b/i.test(values['x-robots-tag'] || '')) {
        assert(expectedUtility.includes(pattern), `Unexpected production HTTP noindex rule: ${pattern}`);
      }
    }
  }
  for (const route of expectedUtility) assert(/\bnoindex\b/i.test(headers.get(route)?.['x-robots-tag'] || ''), `${route}: utility HTTP noindex is missing`);
  assert.equal(headers.get('/*')?.['referrer-policy'], 'no-referrer', 'Resource browsing must not send a referrer');
  assert(headers.get('/*')?.['content-security-policy']?.includes("connect-src 'self'"), 'Public content must restrict external connection requests');
}

try {
  await section('Source route and metadata requirements', checkSources);
  build('production');
  const htmlPages = await readPages();
  await section('Static metadata, headings, landmarks, and local assets', () => checkRenderedPages(htmlPages));
  await section('Internal links and fragments', () => checkLinks(htmlPages));
  await section('Visible Organization and BreadcrumbList structured data', () => checkSchema(htmlPages));
  await section('18 reviewed resource records and public rendering', () => checkResources(htmlPages));
  await section('Default email route and hidden Netlify detection blueprint', () => checkForm(htmlPages));
  await section('Equivalent permanent legacy redirects', checkRedirects);
  await section('Isolated publish directory and unpublished Toledo draft', checkOutputIsolation);
  await section('Production indexing, sitemap, and headers', () => checkIndexing(false));
  build('deploy-preview');
  await section('Deploy-preview noindex in every page and global headers; empty sitemap', () => checkIndexing(true));
  build('production', true);
  const enabledPages = await readPages();
  await section('Explicitly enabled general inquiry form contract and minimal fields', () => checkForm(enabledPages, true));
  await section('Enabled-form build preserves production indexing', () => checkIndexing(false));
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  // A preview check must never leave the local/deployable output deindexed.
  try {
    build('production');
    await section('Production output restored and indexing rechecked', () => checkIndexing(false));
    await section('Default email route restored; detection form hidden', async () => checkForm(await readPages()));
  } catch (error) {
    failures.push(`Failed to restore production output: ${error.stack || error.message}`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} static QA issue(s):\n${failures.map(failure => `- ${failure}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('\nStatic QA passed: 19 pages, 17 indexable routes, 18 resources, and isolated preview indexing. Production output is ready.');
}

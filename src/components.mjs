import { categories, navigation, site } from './config.mjs';

export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
export const arrow = '<span aria-hidden="true">&rarr;</span>';

export function topicCards(ids = categories.map(category => category.id)) {
  return `<div class="card-grid">${categories.filter(category => ids.includes(category.id)).map(category => `<article class="card topic-card"><span class="topic-mark" aria-hidden="true">${arrow}</span><h3><a href="${category.path}">${category.label}</a></h3><p>${category.description}</p></article>`).join('')}</div>`;
}

export function resourceCard(resource) {
  const categoryNames = resource.categories.map(id => categories.find(category => category.id === id)?.label || id);
  return `<article class="card resource-card" data-resource-card data-category="${escapeHtml(resource.categories.join(' '))}" id="resource-${escapeHtml(resource.id)}">
    <p class="resource-type">${categoryNames.map(escapeHtml).join(' · ')}</p>
    <h3>${escapeHtml(resource.name)}</h3><p>${escapeHtml(resource.summary)}</p>
    <dl><div><dt>Who it helps</dt><dd>${escapeHtml(resource.audience)}</dd></div><div><dt>Access and location</dt><dd>${escapeHtml(resource.geography)}</dd></div><div><dt>How to start</dt><dd>${escapeHtml(resource.access)}</dd></div>${resource.cost ? `<div><dt>Cost information</dt><dd>${escapeHtml(resource.cost)}</dd></div>` : ''}</dl>
    <div class="resource-card-bottom"><a class="text-link" href="${escapeHtml(resource.url)}" rel="noreferrer">Visit ${escapeHtml(resource.name)} ${arrow}</a><p class="small muted">Source checked <time datetime="${resource.checked}">${new Date(`${resource.checked}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</time> · <a href="${escapeHtml(resource.sourceUrl)}" rel="noreferrer" aria-label="Official source for ${escapeHtml(resource.name)}">Official source</a></p></div>
  </article>`;
}

export function resourceSection(records, options = {}) {
  if (!records.length) throw new Error('A published resource section must contain records');
  return `<section class="section section-stone" aria-labelledby="resource-list-title"><div class="container"><div class="section-heading"><div><p class="eyebrow">Start with the source</p><h2 id="resource-list-title">${options.heading || 'Resources to explore'}</h2></div><p>Each organization sets its own eligibility and availability. These listings are resources, not CareForVets partner endorsements.</p></div>${options.filterable ? `<div class="resource-controls" hidden data-resource-controls><div class="field"><label for="resource-search">Search resources</label><input id="resource-search" type="search" placeholder="Search by name or type of help" autocomplete="off" aria-controls="resource-results"></div><div class="field"><label for="resource-category">Type of support</label><select id="resource-category" aria-controls="resource-results"><option value="all">All resources</option>${categories.map(category => `<option value="${category.id}">${category.label}</option>`).join('')}</select></div><button class="btn btn-secondary" id="resource-reset" type="button">Reset filters</button></div><p id="resource-count" class="small" role="status" aria-live="polite">${records.length} resources</p>` : ''}<div class="card-grid two resource-results" id="resource-results">${records.map(resourceCard).join('')}</div>${options.filterable ? '<p class="notice" id="resource-empty" hidden>No resources match those words. Try a broader term or reset the filters.</p><noscript><p>All resources are listed above. Search and filtering are available when JavaScript is enabled.</p></noscript>' : ''}</div></section>`;
}

function breadcrumbs(page) {
  if (page.path === '/') return [];
  const items = [{ label: 'Home', path: '/' }];
  if (page.path.startsWith('/resources/') && page.path !== '/resources/') items.push({ label: 'Resources', path: '/resources/' });
  if (page.path.startsWith('/careers/') && page.path !== '/careers/') items.push({ label: 'Careers', path: '/careers/' });
  items.push({ label: page.breadcrumb || page.eyebrow || page.h1, path: page.path });
  return items;
}

export function renderPage(page, { preview = false, assetVersion = '2', records = [], contactFormEnabled = false } = {}) {
  const canonical = `${site.origin}${page.path}`;
  const crumbs = breadcrumbs(page);
  const noindex = preview || page.noindex;
  const schemas = [];
  if (page.path === '/' || page.path === '/about/') schemas.push({ '@context': 'https://schema.org', '@type': 'Organization', '@id': `${site.origin}/#organization`, name: site.name, url: site.origin, logo: `${site.origin}/assets/images/careforvets-logo.png`, email: site.email });
  if (crumbs.length > 1 && !page.noindex) schemas.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: `${site.origin}${item.path}` })) });
  const relevantResources = page.resourceCategories ? records.filter(record => record.categories.some(category => page.resourceCategories.includes(category))) : [];
  let body = page.body;
  if (page.path === '/contact/' && !contactFormEnabled) {
    body = body.replace('<form id="general-inquiry"', `<div class="card contact-email" id="general-inquiry"><p class="eyebrow">General inquiries</p><h2>Send your question by email.</h2><p>Introduce your organization, ask about the CareForVets model, explore a career question, or report a website issue.</p><p><a class="btn btn-primary" href="mailto:${site.email}">Email CareForVets ${arrow}</a></p><p><a href="mailto:${site.email}">${site.email}</a></p><p class="small">Include only general information. Keep medical, benefits, and identifying documents out of your message. A response time is not guaranteed.</p></div><form id="contact-form-blueprint" hidden`);
  }
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title><meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}"><link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#3C3B6E"><meta name="referrer" content="no-referrer">
  <meta property="og:type" content="website"><meta property="og:site_name" content="CareForVets"><meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.origin}/assets/images/brand-banner.png"><meta property="og:image:alt" content="CareForVets — Care, Excellence and Respect">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(page.title)}"><meta name="twitter:description" content="${escapeHtml(page.description)}"><meta name="twitter:image" content="${site.origin}/assets/images/brand-banner.png">
  <link rel="icon" href="/assets/images/careforvets-star.png"><link rel="stylesheet" href="/assets/styles.css?v=${assetVersion}">
  ${schemas.map(schema => `<script type="application/ld+json">${json(schema)}</script>`).join('\n  ')}
  <script src="/assets/site.js?v=${assetVersion}" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
<header class="site-header">
  <div class="utility-bar"><div class="container utility-inner"><span>For military veterans and the people who care for them</span><div><a href="/about/">About</a><a href="/contact/">Contact</a></div></div></div>
  <div class="container nav-wrap"><a class="brand" href="/" aria-label="CareForVets home"><img src="/assets/images/careforvets-logo.png" alt="CareForVets" width="245" height="173"></a>
    <button class="menu-toggle" type="button" aria-controls="site-navigation" aria-expanded="false" hidden><span>Menu</span><span class="menu-lines" aria-hidden="true"></span></button>
    <nav class="site-nav" id="site-navigation" aria-label="Primary navigation">${navigation.map(item => `<a href="${item.path}"${page.path === item.path ? ' aria-current="page"' : ''}>${item.label}</a>`).join('')}<a class="nav-contact" href="/contact/">Get in touch ${arrow}</a></nav>
  </div>
</header>
<main id="main" tabindex="-1">
${page.path === '/' ? page.hero : `<section class="page-hero"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${crumbs.map((item, index) => `<li>${index === crumbs.length - 1 ? `<span aria-current="page">${escapeHtml(item.label)}</span>` : `<a href="${item.path}">${escapeHtml(item.label)}</a>`}</li>`).join('')}</ol></nav><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.h1)}</h1><p class="lead">${escapeHtml(page.intro)}</p>${page.heroActions || ''}</div></section>`}
<section class="section"><div class="container">${body}</div></section>
${page.resourceCategories ? resourceSection(relevantResources, { filterable: page.path === '/resources/', heading: page.resourceHeading }) : ''}
${page.path !== '/contact/' && !page.noindex ? `<section class="section section-tight"><div class="container"><div class="next-step"><div><p class="eyebrow">Keep moving forward</p><h2>Choose the next step that fits your question.</h2><p>Browse the resource library or ask a general question about CareForVets.</p></div><div class="actions"><a class="btn btn-primary" href="/resources/">Explore resources ${arrow}</a><a class="text-link" href="/contact/">Contact CareForVets ${arrow}</a></div></div></div></section>` : ''}
</main>
<footer class="site-footer"><div class="container"><div class="footer-grid"><div class="footer-brand"><img src="/assets/images/careforvets-logo.png" width="245" height="173" alt="CareForVets" loading="lazy"><p>Clear information. Practical next steps.<br>Care, Excellence and Respect.</p><p class="small">CareForVets provides information and welcomes general inquiries. Clinical home health services are in development.</p></div><div><h2>Explore</h2><ul class="footer-links">${navigation.map(item => `<li><a href="${item.path}">${item.label}</a></li>`).join('')}</ul></div><div><h2>About and contact</h2><ul class="footer-links"><li><a href="/about/">Our purpose</a></li><li><a href="/contact/">Contact CareForVets</a></li><li><a href="mailto:${site.email}">${site.email}</a></li><li><a href="/editorial-standards/">Editorial standards</a></li><li><a href="/accessibility/">Accessibility</a></li></ul></div></div><div class="footer-bottom"><p>© ${site.contentDate.slice(0, 4)} CareForVets</p><div><a href="/privacy/">Privacy</a><a href="/terms/">Terms of use</a></div></div><p class="footer-disclaimer">CareForVets is independent and is not affiliated with or endorsed by the U.S. Department of Veterans Affairs or Department of Defense. Please keep medical records and treatment details out of general website forms and email.</p></div></footer>
</body></html>`;
}

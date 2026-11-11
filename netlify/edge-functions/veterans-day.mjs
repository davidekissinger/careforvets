import { renderPage } from '../../src/components.mjs';

export const startsAt = Date.parse('2026-11-11T00:00:00-05:00');
export const endsAt = Date.parse('2026-11-12T00:00:00-05:00');
export const isVeteransDay = (now = Date.now()) => now >= startsAt && now < endsAt;

const page = {
  path: '/',
  title: 'Veterans Day 2026 | Honoring Those Who Served | CareForVets',
  description: 'This Veterans Day, CareForVets honors all who served. Explore practical resources for veterans, family caregivers, and healthcare careers.',
  hero: `<section class="vd-hero"><div class="container vd-grid"><div class="vd-copy"><p class="vd-date">November 11, 2026 <span aria-hidden="true">✦</span> Veterans Day</p><div class="vd-rule" aria-hidden="true"></div><h1>For all you gave.<br>For all you are.<br><em>Thank you.</em></h1><p class="vd-lead">To every veteran: your service is part of our nation’s story. Your life beyond service matters just as much.</p><p>Today, we honor the people behind the uniform—and the families and caregivers who stand beside them.</p><div class="actions"><a class="btn btn-primary" href="/resources/">Find veteran resources <span aria-hidden="true">&rarr;</span></a><a class="vd-link" href="/about/">Our purpose <span aria-hidden="true">&rarr;</span></a></div><p class="vd-signature">Care. Excellence. Respect.<br><span>Today and every day.</span></p></div><div class="vd-visual"><img src="/assets/images/hands-care.webp" width="1282" height="855" alt="Hands offering steady, supportive care" fetchpriority="high"><div class="vd-photo-note"><span aria-hidden="true">✦</span><p>Service deserves recognition.<br><strong>People deserve care.</strong></p></div></div></div></section>`,
  body: `<div class="vd-intro"><p class="eyebrow">Honor through action</p><h2>Gratitude is a beginning.<br>Support is what comes next.</h2><p>Whether you served, care for someone who did, or want to help, take a practical next step.</p></div><div class="path-grid"><a class="path-card" href="/care-navigation/"><span class="path-number">01</span><h3>For veterans</h3><p>Explore care information, benefits resources, and options for support.</p><span class="text-link">Find a starting point &rarr;</span></a><a class="path-card" href="/caregivers/"><span class="path-number">02</span><h3>For those beside them</h3><p>Find practical information for family members and caregivers.</p><span class="text-link">Explore caregiver resources &rarr;</span></a><a class="path-card" href="/careers/"><span class="path-number">03</span><h3>For the next chapter</h3><p>Explore healthcare career paths and veteran employment resources.</p><span class="text-link">Explore career information &rarr;</span></a></div><div class="vd-message"><span aria-hidden="true">✦</span><blockquote>Honoring service. Supporting the next chapter.</blockquote><p>Founded by David E. Kissinger, BSHA, RN<br><span>U.S. Navy veteran · Registered nurse</span></p></div>`,
};

export default async function handler(request, context) {
  if (!['GET', 'HEAD'].includes(request.method) || !isVeteransDay()) return;
  // Preserve the site's CSP/security headers and production/preview indexing policy.
  const original = await context.next();
  if (!original.ok) return original;
  const headers = new Headers(original.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  headers.delete('last-modified');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('netlify-cdn-cache-control', 'no-store');
  const preview = context.deploy?.context !== 'production';
  const html = renderPage(page, { preview }).replace('</head>', '<link rel="stylesheet" href="/assets/veterans-day.css?v=20261111"><script src="/assets/veterans-day.js?v=20261111" defer></script></head>');
  return new Response(request.method === 'HEAD' ? null : html, { status: 200, headers });
}

export const config = { path: '/', onError: 'bypass' };

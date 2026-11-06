import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { renderPage, escapeHtml } from '../src/components.mjs';
import { site, legacyRedirects } from '../src/config.mjs';
import { primaryPages } from '../src/content/primary-pages.mjs';
import { secondaryPages } from '../src/content/secondary-pages.mjs';
import { resources } from '../src/content/resources.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const context = process.env.CONTEXT || 'production';
const preview = context !== 'production';
// The Netlify project currently reports Forms disabled. Make email the default.
// Enable only after form detection and the receiving workflow are verified.
const contactFormEnabled = process.env.CONTACT_FORM_ENABLED === 'true';
const pages = [...primaryPages, ...secondaryPages];
if (new Set(pages.map(page => page.path)).size !== pages.length) throw new Error('Duplicate public route');
const assetVersion = createHash('sha256').update(await readFile(path.join(root, 'assets/styles.css'))).update(await readFile(path.join(root, 'assets/site.js'))).digest('hex').slice(0, 12);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true, filter: source => !source.endsWith('styles-v1.3-base.css') });
for (const page of pages) {
  const relativePath = page.path === '/' ? 'index.html' : page.path.endsWith('.html') ? page.path.slice(1) : `${page.path.slice(1)}index.html`;
  const destination = path.join(output, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, renderPage(page, { preview, assetVersion, records: resources, contactFormEnabled }));
}
const indexable = pages.filter(page => !page.noindex);
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${preview ? '' : indexable.map(page => `  <url><loc>${escapeHtml(site.origin + page.path)}</loc><lastmod>${site.contentDate}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n${preview ? '# Preview pages carry noindex in HTML and HTTP headers.\n' : `Sitemap: ${site.origin}/sitemap.xml\n`}`);
await writeFile(path.join(output, '_redirects'), `# Preserve existing public URLs with equivalent destinations.\n${legacyRedirects.map(([from, to]) => `${from} ${to} 301!`).join('\n')}\nhttps://www.careforvets.com/* ${site.origin}/:splat 301!\n`);
const utilityHeaders = pages.filter(page => page.noindex).map(page => `${page.path}\n  X-Robots-Tag: noindex, follow\n  Cache-Control: no-store\n`).join('\n');
await writeFile(path.join(output, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'\n${preview ? '  X-Robots-Tag: noindex, follow\n' : ''}\n/assets/styles.css\n  Cache-Control: public, max-age=0, must-revalidate\n\n/assets/site.js\n  Cache-Control: public, max-age=0, must-revalidate\n\n/assets/images/*\n  Cache-Control: public, max-age=86400, must-revalidate\n\n${utilityHeaders}`);
console.log(`Built ${pages.length} static pages (${indexable.length} indexable production destinations), ${resources.length} resource records. Context: ${context}${preview ? '; preview noindex enabled' : ''}. Contact: ${contactFormEnabled ? 'web form enabled' : 'email; web form gated'}.`);

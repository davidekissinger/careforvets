import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { legacyRedirects } from '../src/config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const redirects = new Map(legacyRedirects);
createServer(async (request, response) => {
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
    response.end('Local preview does not process inquiries. Form delivery is handled by Netlify after deployment.');
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end('Invalid URL'); return; }
  if (redirects.has(pathname)) { response.writeHead(301, { Location: redirects.get(pathname) }); response.end(); return; }
  let destination = path.resolve(root, `.${pathname}`);
  if (!destination.startsWith(root + path.sep) && destination !== root) { response.writeHead(404); response.end(); return; }
  const code = pathname === '/404.html' ? 404 : 200;
  try {
    if ((await stat(destination)).isDirectory()) {
      if (!pathname.endsWith('/')) { response.writeHead(301, { Location: `${pathname}/` }); response.end(); return; }
      destination = path.join(destination, 'index.html');
    }
    const content = await readFile(destination);
    if (path.basename(destination).startsWith('_')) throw new Error('Private configuration file');
    response.writeHead(code, { 'Content-Type': types[path.extname(destination)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, follow' });
    response.end(request.method === 'HEAD' ? undefined : await readFile(path.join(root, '404.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`CareForVets preview: http://127.0.0.1:${port}`));

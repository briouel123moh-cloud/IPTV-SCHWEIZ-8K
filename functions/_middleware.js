import { ownerPreviewHost, serveOwnerPreview } from '../edge/owner-preview.mjs';

// Country information is supplied by Cloudflare at its edge. Do not trust
// user-provided forwarding chains or application cookies for this check.
const resources = new Set(['/robots.txt', '/sitemap.xml', '/sitemap-index.xml', '/llms.txt', '/style.css', '/app.js', '/favicon.svg']);
function publicResource(pathname) {
  return resources.has(pathname)
    || /^\/images\/[A-Za-z0-9_.-]+\.(?:webp|svg|png|jpe?g)$/.test(pathname)
    || /^\/fonts\/[A-Za-z0-9_.-]+\.(?:woff2|txt)$/.test(pathname)
    || /^\/\.well-known\/acme-challenge\/[A-Za-z0-9_-]+$/.test(pathname);
}

export async function onRequest({ request, next }) {
  if (new URL(request.url).hostname === ownerPreviewHost) {
    return serveOwnerPreview(request, next);
  }
  const country = String(request.cf?.country || request.headers.get('CF-IPCountry') || '').trim().toUpperCase();
  const pathname = new URL(request.url).pathname;
  if (country === 'MA' && !publicResource(pathname)) {
    return new Response('Dieser Dienst ist in deiner Region nicht verfügbar. Ce service est indisponible dans votre région.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
    });
  }
  return next();
}

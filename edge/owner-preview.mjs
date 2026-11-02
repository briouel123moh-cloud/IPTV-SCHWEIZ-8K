import { isVerifiedOwner } from './access-owner.mjs';

export const ownerPreviewHost = 'preview-ch.iptv-usa-8k.com';
const audience = 'df53cbe31574f293a4e7e04845e7238a064c93ada8773fedf2274aafa488eafc';
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export async function serveOwnerPreview(request, serve) {
  if (new URL(request.url).hostname !== ownerPreviewHost ||
      !await isVerifiedOwner(request, audience)) {
    return new Response(request.method === 'HEAD' ? null : 'Owner sign-in required.', { status: 403, headers });
  }
  const result = await serve();
  const response = new Response(result.body, result);
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}

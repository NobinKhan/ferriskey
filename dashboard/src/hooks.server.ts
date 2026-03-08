import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

const BACKEND_URL = (env.BACKEND_URL ?? 'http://localhost:3333').replace(/\/+$/, '');

/**
 * SvelteKit server hook that proxies `/api/*` requests to the Rust backend.
 *
 * This keeps every cookie (`FERRISKEY_SESSION`, `FERRISKEY_IDENTITY`) on the
 * same origin as the dashboard so that `cookies.get()` works in server load
 * functions and the browser never has to make cross-origin fetches.
 */
export const handle: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith('/api/')) {
    return resolve(event);
  }

  const backendPath = event.url.pathname.replace(/^\/api/, '');
  const target = `${BACKEND_URL}${backendPath}${event.url.search}`;

  const headers = new Headers(event.request.headers);
  // Remove host header so the backend sees its own host
  headers.delete('host');

  const response = await fetch(target, {
    method: event.request.method,
    headers,
    body: event.request.method !== 'GET' && event.request.method !== 'HEAD'
      ? await event.request.arrayBuffer()
      : undefined,
    redirect: 'manual',
    // @ts-expect-error Node-fetch duplex option needed for streaming bodies
    duplex: 'half',
  });

  const proxyHeaders = new Headers(response.headers);

  // Forward Set-Cookie headers with domain stripped so they stay on our origin
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    proxyHeaders.delete('set-cookie');
    for (const rawCookie of setCookies) {
      // Strip Domain= so the browser attributes the cookie to the dashboard origin
      const cleaned = rawCookie.replace(/;\s*Domain=[^;]*/gi, '');
      proxyHeaders.append('set-cookie', cleaned);
    }
  }

  // Rewrite Location headers that point to the backend
  const location = proxyHeaders.get('location');
  if (location && location.startsWith(BACKEND_URL)) {
    proxyHeaders.set('location', location.replace(BACKEND_URL, `${event.url.origin}/api`));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: proxyHeaders,
  });
};

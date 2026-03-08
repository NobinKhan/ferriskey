import { env } from '$env/dynamic/public';

/**
 * In development the SvelteKit server hook proxies `/api/*` to the Rust
 * backend, so the default base is simply `/api` on the same origin.
 * Set PUBLIC_API_URL only if the backend is served under a different path.
 */
export function resolveApiBase(url: URL) {
  const override = env.PUBLIC_API_URL?.trim() ?? '';

  if (override.length > 0) {
    return override.replace(/\/+$/, '');
  }

  return `${url.origin.replace(/\/+$/, '')}/api`;
}

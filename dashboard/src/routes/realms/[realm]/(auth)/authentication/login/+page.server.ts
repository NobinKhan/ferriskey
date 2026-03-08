import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { resolveApiBase } from '$lib/api/config';
import { getSessionUser } from '$lib/auth/session';

export const load: PageServerLoad = async ({ cookies, params, url }) => {
  const sessionUser = getSessionUser(cookies.get('FERRISKEY_IDENTITY'));
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const next = url.searchParams.get('next');

  if (sessionUser && !clientId && !redirectUri) {
    throw redirect(303, next || `/realms/${params.realm}/overview`);
  }

  if (!clientId || !redirectUri) {
    const authUrl = new URL(
      `${resolveApiBase(url)}/realms/${params.realm}/protocol/openid-connect/auth`
    );

    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', 'security-admin-console');
    authUrl.searchParams.set(
      'redirect_uri',
      next ? `${url.origin}${next}` : `${url.origin}/realms/${params.realm}/overview`
    );
    authUrl.searchParams.set('scope', 'openid profile email');

    throw redirect(303, authUrl.toString());
  }

  return {
    clientId,
    redirectUri,
    next
  };
};

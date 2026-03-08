import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getSessionUser } from '$lib/auth/session';

export const load: LayoutServerLoad = async ({ cookies, params, url }) => {
  const sessionUser = getSessionUser(cookies.get('FERRISKEY_IDENTITY'));

  if (!sessionUser) {
    const nextPath = `${url.pathname}${url.search}`;
    throw redirect(
      303,
      `/realms/${params.realm}/authentication/login?next=${encodeURIComponent(nextPath)}`
    );
  }

  return {
    sessionUser
  };
};

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getSessionUser } from '$lib/auth/session';
import { loadRealmResource } from '$lib/server/realm-api';

type RealmInfo = {
  id: string;
  name: string;
};

export const load: LayoutServerLoad = async ({ cookies, fetch, params, url }) => {
  const sessionUser = getSessionUser(cookies.get('FERRISKEY_IDENTITY'));

  if (!sessionUser) {
    const nextPath = `${url.pathname}${url.search}`;
    throw redirect(
      303,
      `/realms/${params.realm}/authentication/login?next=${encodeURIComponent(nextPath)}`
    );
  }

  let realms: RealmInfo[] = [];
  try {
    const res = await loadRealmResource<{ data: RealmInfo[] }>(
      { cookies, fetch, params, url },
      `/realms/${params.realm}/users/@me/realms`
    );
    realms = res.data;
  } catch {
    realms = [{ id: params.realm, name: params.realm }];
  }

  return {
    sessionUser,
    realms
  };
};


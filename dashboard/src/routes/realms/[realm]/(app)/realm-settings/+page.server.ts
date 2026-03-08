import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';

type RealmData = {
  id: string;
  name: string;
  enabled: boolean;
  default_signing_algorithm: string;
  settings?: {
    user_registration_enabled: boolean;
    forgot_password_enabled: boolean;
    remember_me_enabled: boolean;
    magic_link_enabled: boolean;
    magic_link_ttl: number;
    compass_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
};

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const realm = await loadRealmResource<RealmData>(
    { cookies, fetch, params, url },
    `/realms/${params.realm}`
  );

  return { realm };
};

export const actions: Actions = {
  'update-settings': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');

    const payload: Record<string, unknown> = {
      user_registration_enabled: form.get('user_registration_enabled') === 'on',
      forgot_password_enabled: form.get('forgot_password_enabled') === 'on',
      remember_me_enabled: form.get('remember_me_enabled') === 'on',
      magic_link_enabled: form.get('magic_link_enabled') === 'on',
      compass_enabled: form.get('compass_enabled') === 'on',
    };

    const ttl = form.get('magic_link_ttl')?.toString().trim();
    if (ttl) {
      payload.magic_link_ttl = parseInt(ttl, 10) || undefined;
    }

    const algo = form.get('default_signing_algorithm')?.toString().trim();
    if (algo) {
      payload.default_signing_algorithm = algo;
    }

    try {
      await apiRequest<{ data: RealmData }>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/settings`,
        init: {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        }
      });

      return { success: true, message: 'Settings updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update settings.'
      });
    }
  }
};

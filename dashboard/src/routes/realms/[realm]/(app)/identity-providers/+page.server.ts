import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';

type IdentityProvider = {
  id: string;
  alias: string;
  provider_id: string;
  display_name: string | null;
  enabled: boolean;
  store_token: boolean;
  trust_email: boolean;
  link_only: boolean;
  config: Record<string, string>;
  created_at: string;
  updated_at: string;
};

type ListResponse = { data: IdentityProvider[] };

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  let providers: IdentityProvider[] = [];
  try {
    const res = await loadRealmResource<ListResponse>(
      { cookies, fetch, params, url },
      `/realms/${params.realm}/identity-providers`
    );
    providers = res.data;
  } catch {
    providers = [];
  }
  return { providers };
};

export const actions: Actions = {
  create: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const alias = form.get('alias')?.toString().trim() ?? '';
    const provider_id = form.get('provider_id')?.toString().trim() ?? '';
    const display_name = form.get('display_name')?.toString().trim() || undefined;
    const enabled = form.get('enabled') === 'on';

    if (!alias || !provider_id) return fail(400, { error: 'Alias and provider type are required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/identity-providers`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ alias, provider_id, display_name, enabled, config: {} })
        }
      });
      return { success: true, message: `Identity provider "${alias}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create provider.'
      });
    }
  },

  delete: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const alias = form.get('alias')?.toString() ?? '';

    if (!alias) return fail(400, { error: 'Alias is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/identity-providers/${alias}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Identity provider deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete provider.'
      });
    }
  },

  update: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const alias = form.get('alias')?.toString() ?? '';
    const display_name = form.get('display_name')?.toString().trim() || undefined;
    const enabled = form.get('enabled') === 'on';
    const trust_email = form.get('trust_email') === 'on';

    if (!alias) return fail(400, { error: 'Alias is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/identity-providers/${alias}`,
        init: {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ display_name, enabled, trust_email })
        }
      });
      return { success: true, message: 'Provider updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update provider.'
      });
    }
  }
};

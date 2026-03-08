import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';

type FederationProvider = {
  id: string;
  name: string;
  provider_type: string;
  enabled: boolean;
  priority: number;
  config: Record<string, string>;
  sync_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ListResponse = { data: FederationProvider[] };

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  let providers: FederationProvider[] = [];
  try {
    const res = await loadRealmResource<ListResponse>(
      { cookies, fetch, params, url },
      `/realms/${params.realm}/federation/providers`
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
    const name = form.get('name')?.toString().trim() ?? '';
    const provider_type = form.get('provider_type')?.toString().trim() ?? 'Ldap';
    const enabled = form.get('enabled') === 'on';
    const priority = parseInt(form.get('priority')?.toString() ?? '0', 10);
    const sync_mode = form.get('sync_mode')?.toString() ?? 'Import';

    if (!name) return fail(400, { error: 'Provider name is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/federation/providers`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, provider_type, enabled, priority, config: {}, sync_mode, sync_enabled: false, sync_interval_minutes: 60 })
        }
      });
      return { success: true, message: `Federation provider "${name}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create provider.'
      });
    }
  },

  delete: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const id = form.get('id')?.toString() ?? '';

    if (!id) return fail(400, { error: 'Provider ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/federation/providers/${id}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Federation provider deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete provider.'
      });
    }
  },

  'test-connection': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const id = form.get('id')?.toString() ?? '';

    if (!id) return fail(400, { error: 'Provider ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/federation/providers/${id}/test-connection`,
        init: { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Connection test successful.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Connection test failed.'
      });
    }
  },

  'sync-users': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const id = form.get('id')?.toString() ?? '';

    if (!id) return fail(400, { error: 'Provider ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/federation/providers/${id}/sync-users`,
        init: { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'User sync initiated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'User sync failed.'
      });
    }
  }
};

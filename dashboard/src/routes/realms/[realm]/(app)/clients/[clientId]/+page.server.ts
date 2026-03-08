import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';

type Client = {
  id: string;
  name: string;
  client_id: string;
  client_type: string;
  protocol: string;
  enabled: boolean;
  public_client: boolean;
  service_account_enabled: boolean;
  direct_access_grants_enabled: boolean;
  client_secret: string | null;
  created_at: string;
  updated_at: string;
};

type RedirectUri = {
  id: string;
  value: string;
  enabled: boolean;
};

type ClientRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  client_id: string | null;
};

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const realm = params.realm;
  const clientId = params.clientId;

  const [client, redirects, postLogoutRedirects, roles] = await Promise.all([
    loadRealmResource<Client>({ cookies, fetch, params, url }, `/realms/${realm}/clients/${clientId}`),
    loadRealmResource<{ data: RedirectUri[] }>({ cookies, fetch, params, url }, `/realms/${realm}/clients/${clientId}/redirects`)
      .then((r) => r.data).catch(() => [] as RedirectUri[]),
    loadRealmResource<{ data: RedirectUri[] }>({ cookies, fetch, params, url }, `/realms/${realm}/clients/${clientId}/post-logout-redirects`)
      .then((r) => r.data).catch(() => [] as RedirectUri[]),
    loadRealmResource<{ data: ClientRole[] }>({ cookies, fetch, params, url }, `/realms/${realm}/clients/${clientId}/roles`)
      .then((r) => r.data).catch(() => [] as ClientRole[]),
  ]);

  return { client, redirects, postLogoutRedirects, roles };
};

export const actions: Actions = {
  'update-client': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');

    const payload: Record<string, unknown> = {
      name: form.get('name')?.toString().trim() || undefined,
      client_id: form.get('client_id_val')?.toString().trim() || undefined,
      enabled: form.get('enabled') === 'on',
      direct_access_grants_enabled: form.get('direct_access_grants_enabled') === 'on',
    };

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/clients/${params.clientId}`,
        init: { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }
      });
      return { success: true, message: 'Client updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update client.'
      });
    }
  },

  'add-redirect': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const value = form.get('value')?.toString().trim() ?? '';

    if (!value) return fail(400, { error: 'Redirect URI is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/clients/${params.clientId}/redirects`,
        init: { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ value, enabled: true }) }
      });
      return { success: true, message: 'Redirect URI added.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to add redirect URI.'
      });
    }
  },

  'delete-redirect': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const uriId = form.get('uri_id')?.toString() ?? '';

    if (!uriId) return fail(400, { error: 'URI ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/clients/${params.clientId}/redirects/${uriId}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Redirect URI deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete redirect URI.'
      });
    }
  },

  'add-post-logout-redirect': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const value = form.get('value')?.toString().trim() ?? '';

    if (!value) return fail(400, { error: 'Post-logout redirect URI is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/clients/${params.clientId}/post-logout-redirects`,
        init: { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ value, enabled: true }) }
      });
      return { success: true, message: 'Post-logout redirect URI added.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to add post-logout redirect URI.'
      });
    }
  },

  'delete-post-logout-redirect': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const uriId = form.get('uri_id')?.toString() ?? '';

    if (!uriId) return fail(400, { error: 'URI ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/clients/${params.clientId}/post-logout-redirects/${uriId}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Post-logout redirect URI deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete post-logout redirect URI.'
      });
    }
  },

  'create-role': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const name = form.get('name')?.toString().trim() ?? '';
    const description = form.get('description')?.toString().trim() || undefined;

    if (!name) return fail(400, { error: 'Role name is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/clients/${params.clientId}/roles`,
        init: { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, description, permissions: [] }) }
      });
      return { success: true, message: `Client role "${name}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create client role.'
      });
    }
  }
};

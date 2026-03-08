import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';
import type { ClientsResponse, ClientResponse, DeleteResponse } from '$lib/types/api';

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const response = await loadRealmResource<ClientsResponse>(
    { cookies, fetch, params, url },
    `/realms/${params.realm}/clients`
  );

  return {
    clients: response.data
  };
};

export const actions: Actions = {
  create: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const name = form.get('name')?.toString().trim() ?? '';
    const clientId = form.get('client_id')?.toString().trim() ?? '';
    const protocol = form.get('protocol')?.toString().trim() || 'openid-connect';
    const clientType = form.get('client_type')?.toString().trim() || 'confidential';
    const publicClient = form.get('public_client') === 'on';
    const serviceAccountEnabled = form.get('service_account_enabled') === 'on';
    const directAccessGrantsEnabled = form.get('direct_access_grants_enabled') === 'on';
    const enabled = form.get('enabled') !== 'off'; // default to enabled

    if (!name || !clientId) {
      return fail(400, {
        error: 'Name and Client ID are required.',
        values: { name, clientId }
      });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      const client = await apiRequest<ClientResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/clients`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name,
            client_id: clientId,
            client_type: clientType,
            protocol,
            public_client: publicClient,
            service_account_enabled: serviceAccountEnabled,
            direct_access_grants_enabled: directAccessGrantsEnabled,
            enabled
          })
        }
      });

      return { success: true, message: `Client "${client.data.name}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create client.',
        values: { name, clientId }
      });
    }
  },

  delete: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString() ?? '';

    if (!id) {
      return fail(400, { error: 'Client ID is required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<DeleteResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/clients/${id}`,
        init: {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      });

      return { success: true, message: 'Client deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete client.'
      });
    }
  },

  update: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString() ?? '';
    const name = form.get('name')?.toString().trim();
    const clientIdVal = form.get('client_id_val')?.toString().trim();
    const enabled = form.get('enabled') === 'on';
    const directAccessGrantsEnabled = form.get('direct_access_grants_enabled') === 'on';

    if (!id) {
      return fail(400, { error: 'Client ID is required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<ClientResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/clients/${id}`,
        init: {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: name || undefined,
            client_id: clientIdVal || undefined,
            enabled,
            direct_access_grants_enabled: directAccessGrantsEnabled
          })
        }
      });

      return { success: true, message: 'Client updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update client.'
      });
    }
  }
};

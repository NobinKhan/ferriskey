import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';

type ClientScope = {
  id: string;
  name: string;
  description: string | null;
  protocol: string;
  is_default: boolean;
  protocol_mappers: ProtocolMapper[];
  created_at: string;
  updated_at: string;
};

type ProtocolMapper = {
  id: string;
  name: string;
  mapper_type: string;
  config: Record<string, unknown>;
};

type ListResponse = { data: ClientScope[] };

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  let scopes: ClientScope[] = [];
  try {
    const res = await loadRealmResource<ListResponse>(
      { cookies, fetch, params, url },
      `/realms/${params.realm}/client-scopes`
    );
    scopes = res.data;
  } catch {
    scopes = [];
  }
  return { scopes };
};

export const actions: Actions = {
  'create-scope': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const name = form.get('name')?.toString().trim() ?? '';
    const description = form.get('description')?.toString().trim() || undefined;
    const protocol = form.get('protocol')?.toString().trim() ?? 'openid-connect';
    const is_default = form.get('is_default') === 'on';

    if (!name) return fail(400, { error: 'Scope name is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/client-scopes`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, description, protocol, is_default })
        }
      });
      return { success: true, message: `Scope "${name}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create scope.'
      });
    }
  },

  'update-scope': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const scope_id = form.get('scope_id')?.toString() ?? '';
    const name = form.get('name')?.toString().trim() || undefined;
    const description = form.get('description')?.toString().trim() || undefined;
    const protocol = form.get('protocol')?.toString().trim() || undefined;
    const is_default = form.has('is_default') ? form.get('is_default') === 'on' : undefined;

    if (!scope_id) return fail(400, { error: 'Scope ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/client-scopes/${scope_id}`,
        init: {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, description, protocol, is_default })
        }
      });
      return { success: true, message: 'Scope updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update scope.'
      });
    }
  },

  'delete-scope': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const scope_id = form.get('scope_id')?.toString() ?? '';

    if (!scope_id) return fail(400, { error: 'Scope ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/client-scopes/${scope_id}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Scope deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete scope.'
      });
    }
  },

  'create-mapper': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const scope_id = form.get('scope_id')?.toString() ?? '';
    const name = form.get('name')?.toString().trim() ?? '';
    const mapper_type = form.get('mapper_type')?.toString().trim() ?? '';

    if (!scope_id || !name || !mapper_type) return fail(400, { error: 'Required fields missing.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/client-scopes/${scope_id}/protocol-mappers`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, mapper_type, config: {} })
        }
      });
      return { success: true, message: `Mapper "${name}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create mapper.'
      });
    }
  },

  'delete-mapper': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const scope_id = form.get('scope_id')?.toString() ?? '';
    const mapper_id = form.get('mapper_id')?.toString() ?? '';

    if (!scope_id || !mapper_id) return fail(400, { error: 'IDs required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/client-scopes/${scope_id}/protocol-mappers/${mapper_id}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Mapper deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete mapper.'
      });
    }
  }
};

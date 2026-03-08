import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';
import type { RolesResponse, RoleResponse, DeleteResponse } from '$lib/types/api';

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const response = await loadRealmResource<RolesResponse>(
    { cookies, fetch, params, url },
    `/realms/${params.realm}/roles`
  );

  return {
    roles: response.data
  };
};

export const actions: Actions = {
  create: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const name = form.get('name')?.toString().trim() ?? '';
    const description = form.get('description')?.toString().trim() || undefined;
    const permissionsRaw = form.get('permissions')?.toString().trim() || '';
    const permissions = permissionsRaw
      ? permissionsRaw.split(',').map((p) => p.trim()).filter(Boolean)
      : [];

    if (!name) {
      return fail(400, { error: 'Role name is required.', values: { name } });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      const role = await apiRequest<RoleResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/roles`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, description, permissions })
        }
      });

      return { success: true, message: `Role "${role.data.name}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create role.',
        values: { name }
      });
    }
  },

  delete: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString() ?? '';

    if (!id) {
      return fail(400, { error: 'Role ID is required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<DeleteResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/roles/${id}`,
        init: {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      });

      return { success: true, message: 'Role deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete role.'
      });
    }
  },

  update: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString() ?? '';
    const name = form.get('name')?.toString().trim() || undefined;
    const description = form.get('description')?.toString().trim() || undefined;

    if (!id) {
      return fail(400, { error: 'Role ID is required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<RoleResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/roles/${id}`,
        init: {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, description })
        }
      });

      return { success: true, message: 'Role updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update role.'
      });
    }
  }
};

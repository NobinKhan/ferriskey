import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';

type User = {
  id: string;
  username: string;
  email: string;
  email_verified: boolean;
  firstname: string;
  lastname: string;
  enabled: boolean;
  is_service_account: boolean;
  required_actions: string[];
  created_at: string;
  updated_at: string;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  client_id: string | null;
};

type Credential = {
  id: string;
  credential_type: string;
  created_at: string;
};

type Permission = string;

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const realm = params.realm;
  const userId = params.userId;

  const [user, roles, credentials, permissions, allRoles] = await Promise.all([
    loadRealmResource<{ data: User }>({ cookies, fetch, params, url }, `/realms/${realm}/users/${userId}`)
      .then((r) => r.data),
    loadRealmResource<{ data: Role[] }>({ cookies, fetch, params, url }, `/realms/${realm}/users/${userId}/roles`)
      .then((r) => r.data).catch(() => [] as Role[]),
    loadRealmResource<{ data: Credential[] }>({ cookies, fetch, params, url }, `/realms/${realm}/users/${userId}/credentials`)
      .then((r) => r.data).catch(() => [] as Credential[]),
    loadRealmResource<{ data: Permission[] }>({ cookies, fetch, params, url }, `/realms/${realm}/users/${userId}/permissions`)
      .then((r) => r.data).catch(() => [] as Permission[]),
    loadRealmResource<{ data: Role[] }>({ cookies, fetch, params, url }, `/realms/${realm}/roles`)
      .then((r) => r.data).catch(() => [] as Role[]),
  ]);

  return { user, roles, credentials, permissions, allRoles };
};

export const actions: Actions = {
  'update-user': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const userId = params.userId;

    const payload: Record<string, unknown> = {};
    const username = form.get('username')?.toString().trim();
    const email = form.get('email')?.toString().trim();
    const firstname = form.get('firstname')?.toString().trim();
    const lastname = form.get('lastname')?.toString().trim();
    const enabled = form.get('enabled') === 'on';
    const emailVerified = form.get('email_verified') === 'on';

    if (username) payload.username = username;
    if (email) payload.email = email;
    if (firstname) payload.firstname = firstname;
    if (lastname) payload.lastname = lastname;
    payload.enabled = enabled;
    payload.email_verified = emailVerified;

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}`,
        init: { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }
      });
      return { success: true, message: 'User updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update user.'
      });
    }
  },

  'reset-password': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const userId = params.userId;
    const password = form.get('password')?.toString() ?? '';

    if (!password || password.length < 4) {
      return fail(400, { error: 'Password must be at least 4 characters.' });
    }

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}/reset-password`,
        init: { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) }
      });
      return { success: true, message: 'Password reset successfully.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to reset password.'
      });
    }
  },

  'assign-role': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const userId = params.userId;
    const roleId = form.get('role_id')?.toString() ?? '';

    if (!roleId) return fail(400, { error: 'Role ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}/roles/${roleId}`,
        init: { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Role assigned.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to assign role.'
      });
    }
  },

  'unassign-role': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const userId = params.userId;
    const roleId = form.get('role_id')?.toString() ?? '';

    if (!roleId) return fail(400, { error: 'Role ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}/roles/${roleId}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Role unassigned.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to unassign role.'
      });
    }
  },

  'delete-credential': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const token = cookies.get('FERRISKEY_IDENTITY');
    const userId = params.userId;
    const credentialId = form.get('credential_id')?.toString() ?? '';

    if (!credentialId) return fail(400, { error: 'Credential ID is required.' });

    try {
      await apiRequest<unknown>({
        url, fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}/credentials/${credentialId}`,
        init: { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      });
      return { success: true, message: 'Credential deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete credential.'
      });
    }
  }
};

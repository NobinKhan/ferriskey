import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';
import type { UsersResponse, UserResponse, DeleteResponse } from '$lib/types/api';

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const response = await loadRealmResource<UsersResponse>(
    { cookies, fetch, params, url },
    `/realms/${params.realm}/users`
  );

  return {
    users: response.data
  };
};

export const actions: Actions = {
  create: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const username = form.get('username')?.toString().trim() ?? '';
    const firstname = form.get('firstname')?.toString().trim() ?? '';
    const lastname = form.get('lastname')?.toString().trim() ?? '';
    const email = form.get('email')?.toString().trim() ?? '';
    const emailVerified = form.get('email_verified') === 'on';

    if (!username || !firstname || !lastname || !email) {
      return fail(400, {
        error: 'All fields are required.',
        values: { username, firstname, lastname, email }
      });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      const user = await apiRequest<UserResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/users`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            username,
            firstname,
            lastname,
            email,
            email_verified: emailVerified
          })
        }
      });

      return { success: true, message: `User "${user.data.username}" created.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create user.',
        values: { username, firstname, lastname, email }
      });
    }
  },

  delete: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const userId = form.get('user_id')?.toString() ?? '';

    if (!userId) {
      return fail(400, { error: 'User ID is required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<DeleteResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}`,
        init: {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      });

      return { success: true, message: 'User deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete user.'
      });
    }
  },

  update: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const userId = form.get('user_id')?.toString() ?? '';
    const firstname = form.get('firstname')?.toString().trim() ?? '';
    const lastname = form.get('lastname')?.toString().trim() ?? '';
    const email = form.get('email')?.toString().trim() ?? '';
    const emailVerified = form.get('email_verified') === 'on';
    const enabled = form.get('enabled') === 'on';

    if (!userId || !firstname || !lastname || !email) {
      return fail(400, { error: 'All fields are required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      const user = await apiRequest<UserResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}`,
        init: {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            firstname,
            lastname,
            email,
            email_verified: emailVerified,
            enabled
          })
        }
      });

      return { success: true, message: `User "${user.data.username}" updated.` };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update user.'
      });
    }
  },

  'toggle-status': async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const userId = form.get('user_id')?.toString() ?? '';
    const currentEnabled = form.get('currently_enabled') === 'true';
    const firstname = form.get('firstname')?.toString() ?? '';
    const lastname = form.get('lastname')?.toString() ?? '';
    const email = form.get('email')?.toString() ?? '';

    if (!userId) {
      return fail(400, { error: 'User ID is required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<UserResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/users/${userId}`,
        init: {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            firstname,
            lastname,
            email,
            enabled: !currentEnabled
          })
        }
      });

      return {
        success: true,
        message: `User ${currentEnabled ? 'disabled' : 'enabled'}.`
      };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to toggle user status.'
      });
    }
  }
};

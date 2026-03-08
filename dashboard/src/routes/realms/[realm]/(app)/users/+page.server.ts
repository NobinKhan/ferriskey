import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiRequest, ApiError } from '$lib/api/client';

type Role = {
  id: string;
  name: string;
};

type User = {
  client_id?: string | null;
  created_at: string;
  email: string;
  email_verified: boolean;
  enabled: boolean;
  firstname: string;
  id: string;
  lastname: string;
  required_actions: string[];
  roles?: Role[] | null;
  username: string;
};

type UsersResponse = {
  data: User[];
};

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const token = cookies.get('FERRISKEY_IDENTITY');

  try {
    const response = await apiRequest<UsersResponse>({
      url,
      fetcher: fetch,
      path: `/realms/${params.realm}/users`,
      init: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    return {
      users: response.data
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect(303, `/realms/${params.realm}/authentication/login`);
    }

    throw error;
  }
};

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';
import { apiRequest, ApiError } from '$lib/api/client';

type Webhook = {
  id: string;
  name: string | null;
  description: string | null;
  endpoint: string;
  headers: Record<string, string>;
  subscribers: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type WebhooksResponse = { data: Webhook[] };
type WebhookResponse = { data: Webhook };

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  let webhooks: Webhook[] = [];
  try {
    const response = await loadRealmResource<WebhooksResponse>(
      { cookies, fetch, params, url },
      `/realms/${params.realm}/webhooks`
    );
    webhooks = response.data;
  } catch {
    webhooks = [];
  }

  return { webhooks };
};

export const actions: Actions = {
  create: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const name = form.get('name')?.toString().trim() || undefined;
    const description = form.get('description')?.toString().trim() || undefined;
    const endpoint = form.get('endpoint')?.toString().trim() ?? '';
    const subscribersRaw = form.get('subscribers')?.toString().trim() || '';
    const subscribers = subscribersRaw ? subscribersRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

    if (!endpoint || subscribers.length === 0) {
      return fail(400, { error: 'Endpoint and at least one subscriber are required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<WebhookResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/webhooks`,
        init: {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, description, endpoint, headers: {}, subscribers })
        }
      });

      return { success: true, message: 'Webhook created.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to create webhook.'
      });
    }
  },

  delete: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString() ?? '';

    if (!id) return fail(400, { error: 'Webhook ID is required.' });

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<unknown>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/webhooks/${id}`,
        init: {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      });

      return { success: true, message: 'Webhook deleted.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to delete webhook.'
      });
    }
  },

  update: async ({ cookies, fetch, params, request, url }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString() ?? '';
    const name = form.get('name')?.toString().trim() || undefined;
    const description = form.get('description')?.toString().trim() || undefined;
    const endpoint = form.get('endpoint')?.toString().trim() ?? '';
    const subscribersRaw = form.get('subscribers')?.toString().trim() || '';
    const subscribers = subscribersRaw ? subscribersRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

    if (!id || !endpoint || subscribers.length === 0) {
      return fail(400, { error: 'Endpoint and at least one subscriber are required.' });
    }

    const token = cookies.get('FERRISKEY_IDENTITY');

    try {
      await apiRequest<WebhookResponse>({
        url,
        fetcher: fetch,
        path: `/realms/${params.realm}/webhooks/${id}`,
        init: {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, description, endpoint, headers: {}, subscribers })
        }
      });

      return { success: true, message: 'Webhook updated.' };
    } catch (error) {
      return fail(error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.message : 'Failed to update webhook.'
      });
    }
  }
};

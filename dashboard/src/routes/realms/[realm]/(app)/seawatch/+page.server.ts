import type { PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';

type SecurityEvent = {
  id: { inner: string } | string;
  realm_id: { inner: string } | string;
  actor_id: string | null;
  actor_type: string | null;
  event_type: string;
  status: string;
  target_type: string | null;
  target_id: string | null;
  resource: string | null;
  timestamp: string;
  trace_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
};

type EventsResponse = { data: SecurityEvent[] };

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  let events: SecurityEvent[] = [];
  try {
    const response = await loadRealmResource<EventsResponse>(
      { cookies, fetch, params, url },
      `/realms/${params.realm}/seawatch/v1/security-events`
    );
    events = response.data;
  } catch {
    // SeaWatch endpoint may not exist in older backend versions
    events = [];
  }

  return { events };
};

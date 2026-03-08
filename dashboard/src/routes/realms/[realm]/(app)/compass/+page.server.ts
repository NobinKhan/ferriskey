import type { PageServerLoad } from './$types';
import { loadRealmResource } from '$lib/server/realm-api';

type FlowStats = {
  total_flows: number;
  successful_flows: number;
  failed_flows: number;
  active_flows: number;
  average_duration_ms: number;
};

type CompassFlow = {
  id: string;
  realm_name: string;
  client_id: string | null;
  user_id: string | null;
  grant_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  steps: unknown[];
};

type StatsResponse = { data: FlowStats };
type FlowsResponse = { data: CompassFlow[] };

export const load: PageServerLoad = async ({ cookies, fetch, params, url }) => {
  const realm = params.realm;

  const [stats, flows] = await Promise.all([
    loadRealmResource<StatsResponse>(
      { cookies, fetch, params, url },
      `/realms/${realm}/compass/v1/stats`
    ).then((r) => r.data).catch(() => ({
      total_flows: 0, successful_flows: 0, failed_flows: 0,
      active_flows: 0, average_duration_ms: 0
    } as FlowStats)),
    loadRealmResource<FlowsResponse>(
      { cookies, fetch, params, url },
      `/realms/${realm}/compass/v1/flows?limit=50`
    ).then((r) => r.data).catch(() => [] as CompassFlow[]),
  ]);

  return { stats, flows };
};

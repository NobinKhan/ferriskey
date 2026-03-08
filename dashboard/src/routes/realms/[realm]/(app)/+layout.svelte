<script lang="ts">
  import AppShell from '$components/AppShell.svelte';
  import { page } from '$app/state';
  import type { LayoutData } from './$types';

  let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
  const currentRealm = $derived(String(page.params.realm ?? 'master'));
</script>

<AppShell realm={currentRealm} user={data.sessionUser}>{@render children()}</AppShell>

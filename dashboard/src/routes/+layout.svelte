<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import '../app.css';
  import { queryClient } from '$lib/query/client';
  import Toaster from '$components/Toaster.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/fav.png" type="image/png" />
  <title>FerrisKey Dashboard</title>
  <meta
    name="description"
    content="FerrisKey Dashboard – next-generation IAM admin experience."
  />
</svelte:head>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <Toaster />
</QueryClientProvider>

<script lang="ts">
  import type { PageData } from './$types';
  import { Compass, Search, CheckCircle, XCircle, Clock, Activity, BarChart3, Zap } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  let { data }: { data: PageData } = $props();
  const filters = ['All', 'Success', 'Failed', 'Active'];
  let activeFilter = $state('All');
  let searchTerm = $state('');

  function formatMs(ms: number | null) {
    if (ms == null) return '—';
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  }

  function formatTs(ts: string) {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d);
  }

  function statusTone(status: string): string {
    if (status === 'success' || status === 'completed') return 'success';
    if (status === 'failed' || status === 'error') return 'danger';
    return 'active';
  }

  const visible = $derived.by(() => {
    let items = data.flows;
    if (activeFilter !== 'All') items = items.filter((f) => {
      if (activeFilter === 'Success') return f.status === 'success' || f.status === 'completed';
      if (activeFilter === 'Failed') return f.status === 'failed' || f.status === 'error';
      return f.status === 'active' || f.status === 'pending';
    });
    const t = searchTerm.trim().toLowerCase();
    if (t) items = items.filter((f) => [f.grant_type, f.status, f.client_id ?? ''].some((v) => v.toLowerCase().includes(t)));
    return items;
  });

  let selectedId = $state<string | null>(null);
  const selected = $derived(selectedId ? data.flows.find((f) => f.id === selectedId) ?? visible[0] ?? null : visible[0] ?? null);
</script>

<div class="compass-page">
  <section class="compass-page__hero glass-panel">
    <div>
      <p>Compass — Authentication Flows</p>
      <h2>Auth flows — track, analyze, optimize.</h2>
      <span>Monitor authentication flow execution in real time.</span>
    </div>
    <ChipTabs items={filters} active={activeFilter} tone="soft" onselect={(item) => (activeFilter = item)} />
  </section>

  <section class="compass-page__metrics">
    <MetricCard title="Total flows" value={String(data.stats.total_flows)} delta="recorded" meta="authentication flows">
      {#snippet icon()}<Compass size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Successful" value={String(data.stats.successful_flows)} delta="completed" meta="authorized" tone="success">
      {#snippet icon()}<CheckCircle size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Failed" value={String(data.stats.failed_flows)} delta="errors" meta="denied or errored" tone="primary">
      {#snippet icon()}<XCircle size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Avg duration" value={formatMs(data.stats.average_duration_ms)} delta="per flow" meta="latency metric" tone="success">
      {#snippet icon()}<BarChart3 size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="compass-page__content">
    <SectionCard eyebrow="Timeline" title="Flow history" description="Browse authentication flows.">
      {#snippet actions()}
        <label class="compass-page__search"><Search size={16} /><input type="search" placeholder="Search by grant type, status..." bind:value={searchTerm} /></label>
      {/snippet}
      <div class="flow-list">
        {#if visible.length > 0}
          {#each visible as flow (flow.id)}
            <div class="flow-row" class:flow-row--selected={selected?.id === flow.id} role="button" tabindex="0"
              onclick={() => (selectedId = flow.id)} onkeydown={(e) => e.key === 'Enter' && (selectedId = flow.id)}>
              <div class="flow-row__icon flow-row__icon--{statusTone(flow.status)}">
                {#if statusTone(flow.status) === 'success'}<CheckCircle size={16} />{:else if statusTone(flow.status) === 'danger'}<XCircle size={16} />{:else}<Activity size={16} />{/if}
              </div>
              <div class="flow-row__info">
                <strong>{flow.grant_type}</strong>
                <small>{flow.client_id ?? 'N/A'} · {formatMs(flow.duration_ms)}</small>
              </div>
              <div class="flow-row__time"><Clock size={12} /><small>{formatTs(flow.started_at)}</small></div>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No flows to display.</strong><small>{data.flows.length === 0 ? 'No authentication flows recorded yet.' : 'No flows match the current filter.'}</small></div>
        {/if}
      </div>
    </SectionCard>

    <div class="compass-page__stack">
      <SectionCard eyebrow="Details" title="Selected flow" compact={true}>
        {#if selected}
          <div class="detail-grid">
            <div><span>Grant type</span><strong>{selected.grant_type}</strong></div>
            <div><span>Status</span><strong class="status-{statusTone(selected.status)}">{selected.status}</strong></div>
            <div><span>Client</span><strong>{selected.client_id ?? '—'}</strong></div>
            <div><span>User</span><strong>{selected.user_id ?? '—'}</strong></div>
            <div><span>Duration</span><strong>{formatMs(selected.duration_ms)}</strong></div>
            <div><span>Started</span><strong>{formatTs(selected.started_at)}</strong></div>
          </div>
        {:else}
          <div class="empty-state--compact"><strong>No flow selected.</strong></div>
        {/if}
      </SectionCard>

      {#if selected && selected.steps.length > 0}
        <SectionCard eyebrow="Steps" title="Flow steps" compact={true}>
          <pre class="compass-page__json">{JSON.stringify(selected.steps, null, 2)}</pre>
        </SectionCard>
      {/if}
    </div>
  </section>
</div>

<style>
  .compass-page, .compass-page__stack { display: grid; gap: 24px; }
  .compass-page__hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 24px; }
  p, span, small { margin: 0; color: var(--text-muted); }
  h2 { margin: 8px 0 10px; font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display); letter-spacing: -0.05em; }
  .compass-page__metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
  .compass-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }
  .compass-page__search { display: inline-flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
  .compass-page__search input { border: 0; outline: 0; background: transparent; min-width: 200px; color: var(--text); }
  .flow-list { display: grid; gap: 8px; }
  .flow-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; background: var(--bg-inset); border: 1px solid var(--border); cursor: pointer; transition: border-color 160ms ease; }
  .flow-row:hover { border-color: var(--border-strong); }
  .flow-row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
  .flow-row__icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 12px; }
  .flow-row__icon--success { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .flow-row__icon--danger { background: color-mix(in srgb, var(--danger) 14%, transparent); color: var(--danger); }
  .flow-row__icon--active { background: var(--primary-soft); color: var(--primary); }
  .flow-row__info { display: grid; gap: 2px; }
  .flow-row__info strong { color: var(--text); }
  .flow-row__time { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.82rem; }
  .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .detail-grid div { display: grid; gap: 4px; padding: 16px; border-radius: 18px; background: var(--bg-inset); border: 1px solid var(--border); }
  .status-success { color: var(--success); }
  .status-danger { color: var(--danger); }
  .status-active { color: var(--primary); }
  .compass-page__json { padding: 16px; border-radius: 14px; background: var(--bg-inset); border: 1px solid var(--border); font-size: 0.82rem; overflow-x: auto; color: var(--text-soft); white-space: pre-wrap; word-break: break-all; }
  .empty-state { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); display: grid; gap: 4px; }
  .empty-state strong { color: var(--text); }
  .empty-state--compact strong { color: var(--text); }
  @media (max-width: 1000px) { .compass-page__metrics { grid-template-columns: repeat(2, 1fr); } .compass-page__content, .detail-grid { grid-template-columns: 1fr; } .compass-page__hero { flex-direction: column; align-items: flex-start; } }
</style>

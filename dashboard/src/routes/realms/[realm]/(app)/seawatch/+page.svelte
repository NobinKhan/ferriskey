<script lang="ts">
  import type { PageData } from './$types';
  import {
    Shield,
    Search,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity
  } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  let { data }: { data: PageData } = $props();
  const filters = ['All', 'Success', 'Failure'];
  let activeFilter = $state('All');
  let searchTerm = $state('');

  /* ── Helpers ────────────────────────────────────────────── */
  function eventId(e: PageData['events'][number]) {
    const raw = e.id;
    return typeof raw === 'object' && raw !== null && 'inner' in raw ? String((raw as { inner: string }).inner) : String(raw);
  }

  function eventLabel(type: string) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatTs(ts: string) {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  }

  function statusTone(status: string) {
    return status === 'success' ? 'success' : 'danger';
  }

  /* ── Metrics ────────────────────────────────────────────── */
  const totalEvents = $derived(data.events.length);
  const successCount = $derived(data.events.filter((e) => e.status === 'success').length);
  const failureCount = $derived(data.events.filter((e) => e.status === 'failure').length);
  const uniqueTypes = $derived(new Set(data.events.map((e) => e.event_type)).size);

  /* ── Filtered list ──────────────────────────────────────── */
  const visibleEvents = $derived.by(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.events.filter((e) => {
      const filterMatch =
        activeFilter === 'All' ||
        (activeFilter === 'Success' && e.status === 'success') ||
        (activeFilter === 'Failure' && e.status === 'failure');
      if (!filterMatch) return false;
      if (!term) return true;
      return [e.event_type, e.status, e.actor_type ?? '', e.ip_address ?? '', e.resource ?? ''].some(
        (v) => v.toLowerCase().includes(term)
      );
    });
  });

  let selectedIdx = $state<string | null>(null);
  const selectedEvent = $derived(
    selectedIdx ? data.events.find((e) => eventId(e) === selectedIdx) ?? visibleEvents[0] ?? null : visibleEvents[0] ?? null
  );
</script>

<div class="seawatch-page">
  <section class="seawatch-page__hero glass-panel">
    <div>
      <p>SeaWatch — Security audit trail</p>
      <h2>Security events — observe, investigate, respond.</h2>
      <span>Real-time audit log of authentication, authorization, and administrative actions.</span>
    </div>
    <div class="seawatch-page__hero-actions">
      <ChipTabs items={filters} active={activeFilter} tone="soft" onselect={(item) => (activeFilter = item)} />
    </div>
  </section>

  <section class="seawatch-page__metrics">
    <MetricCard title="Total events" value={String(totalEvents)} delta={`${uniqueTypes} types`} meta="all recorded events">
      {#snippet icon()}<Activity size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Successful" value={String(successCount)} delta="Authorized actions" meta="completed without errors" tone="success">
      {#snippet icon()}<CheckCircle size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Failures" value={String(failureCount)} delta="Denied or failed" meta="requires investigation" tone="primary">
      {#snippet icon()}<AlertTriangle size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="seawatch-page__content">
    <SectionCard eyebrow="Audit log" title="Event timeline" description="Browse security events from the current realm.">
      {#snippet actions()}
        <label class="seawatch-page__search">
          <Search size={16} />
          <input type="search" placeholder="Search by type, IP, actor..." bind:value={searchTerm} />
        </label>
      {/snippet}

      <div class="event-list">
        {#if visibleEvents.length > 0}
          {#each visibleEvents as event (eventId(event))}
            <div
              class="event-row"
              class:event-row--selected={selectedEvent && eventId(selectedEvent) === eventId(event)}
              role="button"
              tabindex="0"
              onclick={() => (selectedIdx = eventId(event))}
              onkeydown={(e) => e.key === 'Enter' && (selectedIdx = eventId(event))}
            >
              <div class="event-row__icon event-row__icon--{statusTone(event.status)}">
                {#if event.status === 'success'}
                  <CheckCircle size={16} />
                {:else}
                  <AlertTriangle size={16} />
                {/if}
              </div>
              <div class="event-row__info">
                <strong>{eventLabel(event.event_type)}</strong>
                <small>{event.actor_type ?? 'system'} · {event.ip_address ?? 'N/A'}</small>
              </div>
              <div class="event-row__time">
                <Clock size={12} />
                <small>{formatTs(event.timestamp)}</small>
              </div>
            </div>
          {/each}
        {:else}
          <div class="seawatch-page__empty">
            <strong>No events to display.</strong>
            <small>{data.events.length === 0 ? 'No security events recorded yet.' : 'No events match the current filter.'}</small>
          </div>
        {/if}
      </div>
    </SectionCard>

    <div class="seawatch-page__stack">
      <SectionCard eyebrow="Details" title="Selected event" compact={true}>
        {#if selectedEvent}
          <div class="seawatch-page__detail-grid">
            <div><span>Type</span><strong>{eventLabel(selectedEvent.event_type)}</strong></div>
            <div><span>Status</span><strong class="status-{statusTone(selectedEvent.status)}">{selectedEvent.status}</strong></div>
            <div><span>Actor type</span><strong>{selectedEvent.actor_type ?? '—'}</strong></div>
            <div><span>IP address</span><strong>{selectedEvent.ip_address ?? '—'}</strong></div>
            <div><span>Resource</span><strong>{selectedEvent.resource ?? '—'}</strong></div>
            <div><span>Timestamp</span><strong>{formatTs(selectedEvent.timestamp)}</strong></div>
          </div>
        {:else}
          <div class="seawatch-page__empty seawatch-page__empty--compact">
            <strong>No event selected.</strong>
          </div>
        {/if}
      </SectionCard>

      {#if selectedEvent?.details}
        <SectionCard eyebrow="Payload" title="Event details" compact={true}>
          <pre class="seawatch-page__json">{JSON.stringify(selectedEvent.details, null, 2)}</pre>
        </SectionCard>
      {/if}
    </div>
  </section>
</div>

<style>
  .seawatch-page, .seawatch-page__stack { display: grid; gap: 24px; }

  .seawatch-page__hero {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: 20px; padding: 24px;
  }

  p, span, small { margin: 0; color: var(--text-muted); }

  h2 {
    margin: 8px 0 10px;
    font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display);
    letter-spacing: -0.05em;
  }

  .seawatch-page__hero-actions { display: grid; gap: 12px; justify-items: end; }
  .seawatch-page__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .seawatch-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }

  .seawatch-page__search {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 16px; border-radius: 16px; background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-md);
  }
  .seawatch-page__search input { border: 0; outline: 0; background: transparent; min-width: 220px; color: var(--text); }

  .event-list { display: grid; gap: 8px; }

  .event-row {
    display: grid; grid-template-columns: auto 1fr auto;
    align-items: center; gap: 14px; padding: 14px 16px;
    border-radius: 16px; background: var(--bg-inset);
    border: 1px solid var(--border); cursor: pointer;
    transition: border-color 160ms ease;
  }
  .event-row:hover { border-color: var(--border-strong); }
  .event-row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

  .event-row__icon {
    display: grid; place-items: center; width: 36px; height: 36px;
    border-radius: 12px;
  }
  .event-row__icon--success { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .event-row__icon--danger { background: color-mix(in srgb, var(--danger) 14%, transparent); color: var(--danger); }

  .event-row__info { display: grid; gap: 2px; }
  strong { color: var(--text); }

  .event-row__time { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.82rem; }

  .seawatch-page__empty { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); }
  .seawatch-page__empty--compact { padding: 0; background: transparent; border: 0; }

  .seawatch-page__detail-grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
  }
  .seawatch-page__detail-grid div {
    display: grid; gap: 4px; padding: 16px; border-radius: 18px;
    background: var(--bg-inset); border: 1px solid var(--border);
  }

  .status-success { color: var(--success); }
  .status-danger { color: var(--danger); }

  .seawatch-page__json {
    padding: 16px; border-radius: 14px; background: var(--bg-inset);
    border: 1px solid var(--border); font-size: 0.82rem; overflow-x: auto;
    color: var(--text-soft); white-space: pre-wrap; word-break: break-all;
  }

  @media (max-width: 1000px) {
    .seawatch-page__metrics,
    .seawatch-page__content,
    .seawatch-page__detail-grid { grid-template-columns: 1fr; }
    .seawatch-page__hero { flex-direction: column; align-items: flex-start; }
  }
</style>

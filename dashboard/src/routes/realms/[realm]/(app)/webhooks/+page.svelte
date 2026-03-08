<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import {
    Webhook,
    Search,
    Plus,
    Pencil,
    Trash2,
    Globe,
    Bell,
    Zap
  } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';
  import Dialog from '$components/Dialog.svelte';
  import ConfirmDelete from '$components/ConfirmDelete.svelte';
  import { showToast } from '$lib/stores/toast';
  import { ripple } from '$utils/ripple';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let searchTerm = $state('');

  /* ── Create ─────────────────────────────────────────────── */
  let showCreate = $state(false);
  let creating = $state(false);

  /* ── Edit ───────────────────────────────────────────────── */
  let showEdit = $state(false);
  let editWebhook = $state<PageData['webhooks'][number] | null>(null);
  let editing = $state(false);

  /* ── Delete ─────────────────────────────────────────────── */
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<PageData['webhooks'][number] | null>(null);
  let deleting = $state(false);

  $effect(() => {
    if (form && typeof form === 'object') {
      const f = form as Record<string, unknown>;
      if (f.success && typeof f.message === 'string') {
        showToast(f.message, 'success');
        showCreate = false;
        showEdit = false;
        showDeleteConfirm = false;
      } else if (typeof f.error === 'string') {
        showToast(f.error, 'error');
      }
      creating = false;
      editing = false;
      deleting = false;
    }
  });

  const ALL_TRIGGERS = [
    'user.created', 'user.updated', 'user.deleted', 'user.bulk_deleted',
    'user.role.assigned', 'user.role.unassigned', 'user.credentials.deleted',
    'auth.reset_password',
    'client.created', 'client.updated', 'client.deleted',
    'client.role.created', 'client.role.updated',
    'redirect_uri.created', 'redirect_uri.updated', 'redirect_uri.deleted',
    'role.created', 'role.updated', 'role.deleted', 'role.permission.updated',
    'realm.created', 'realm.updated', 'realm.deleted', 'realm.settings.updated',
    'webhook.created', 'webhook.updated', 'webhook.deleted',
  ];

  /* ── Metrics ────────────────────────────────────────────── */
  const totalWebhooks = $derived(data.webhooks.length);
  const totalSubs = $derived(data.webhooks.reduce((a, w) => a + w.subscribers.length, 0));

  /* ── Filtered list ──────────────────────────────────────── */
  const visibleWebhooks = $derived.by(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data.webhooks;
    return data.webhooks.filter((w) =>
      [w.name ?? '', w.endpoint, w.description ?? '', ...w.subscribers].some((v) =>
        v.toLowerCase().includes(term)
      )
    );
  });

  let selectedId = $state<string | null>(null);
  const selectedWebhook = $derived(
    selectedId ? data.webhooks.find((w) => w.id === selectedId) ?? visibleWebhooks[0] ?? null : visibleWebhooks[0] ?? null
  );
</script>

<div class="webhooks-page">
  <section class="webhooks-page__hero glass-panel">
    <div>
      <p>Event delivery</p>
      <h2>Webhooks — subscribe, relay, automate.</h2>
      <span>Register endpoints to receive real-time notifications for lifecycle events.</span>
    </div>
    <div class="webhooks-page__hero-actions">
      <button type="button" class="webhooks-page__cta" use:ripple onclick={() => (showCreate = true)}>
        <Plus size={16} />
        Create webhook
      </button>
    </div>
  </section>

  <section class="webhooks-page__metrics">
    <MetricCard title="Webhooks" value={String(totalWebhooks)} delta="registered" meta="active integrations">
      {#snippet icon()}<Webhook size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Subscriptions" value={String(totalSubs)} delta="total event bindings" meta="across all webhooks" tone="primary">
      {#snippet icon()}<Bell size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Available triggers" value={String(ALL_TRIGGERS.length)} delta="event types" meta="supported by the platform" tone="success">
      {#snippet icon()}<Zap size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="webhooks-page__content">
    <SectionCard eyebrow="Registry" title="Manage webhooks" description="Browse, edit, or remove webhook integrations.">
      {#snippet actions()}
        <label class="webhooks-page__search">
          <Search size={16} />
          <input type="search" placeholder="Search by name, endpoint..." bind:value={searchTerm} />
        </label>
      {/snippet}

      <div class="webhook-list">
        {#if visibleWebhooks.length > 0}
          {#each visibleWebhooks as webhook (webhook.id)}
            <div
              class="webhook-row"
              class:webhook-row--selected={selectedWebhook?.id === webhook.id}
              role="button"
              tabindex="0"
              onclick={() => (selectedId = webhook.id)}
              onkeydown={(e) => e.key === 'Enter' && (selectedId = webhook.id)}
            >
              <div class="webhook-row__identity">
                <span><Globe size={18} /></span>
                <div>
                  <strong>{webhook.name || 'Unnamed webhook'}</strong>
                  <small>{webhook.endpoint}</small>
                </div>
              </div>
              <div class="webhook-row__subs">{webhook.subscribers.length} triggers</div>
              <div class="webhook-row__actions">
                <button type="button" aria-label="Edit" onclick={(e: MouseEvent) => { e.stopPropagation(); editWebhook = webhook; showEdit = true; }} use:ripple>
                  <Pencil size={14} />
                </button>
                <button type="button" aria-label="Delete" onclick={(e: MouseEvent) => { e.stopPropagation(); deleteTarget = webhook; showDeleteConfirm = true; }} use:ripple>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="webhooks-page__empty">
            <strong>No webhooks registered.</strong>
            <small>Create one to start receiving event notifications.</small>
          </div>
        {/if}
      </div>
    </SectionCard>

    <div class="webhooks-page__stack">
      <SectionCard eyebrow="Details" title="Selected webhook" compact={true}>
        {#if selectedWebhook}
          <div class="webhooks-page__detail-grid">
            <div><span>Name</span><strong>{selectedWebhook.name || '—'}</strong></div>
            <div><span>Endpoint</span><strong>{selectedWebhook.endpoint}</strong></div>
            <div><span>Description</span><strong>{selectedWebhook.description || '—'}</strong></div>
            <div><span>Triggers</span><strong>{selectedWebhook.subscribers.length}</strong></div>
          </div>
        {:else}
          <div class="webhooks-page__empty webhooks-page__empty--compact"><strong>No webhook selected.</strong></div>
        {/if}
      </SectionCard>

      <SectionCard eyebrow="Triggers" title="Subscribed events" compact={true}>
        {#if selectedWebhook && selectedWebhook.subscribers.length > 0}
          <div class="webhooks-page__chips">
            {#each selectedWebhook.subscribers as trigger (trigger)}
              <span>{trigger}</span>
            {/each}
          </div>
        {:else}
          <div class="webhooks-page__empty webhooks-page__empty--compact"><strong>No triggers.</strong></div>
        {/if}
      </SectionCard>
    </div>
  </section>
</div>

<!-- ── Create ──────────────────────────────────────────────── -->
<Dialog bind:open={showCreate} title="Create webhook">
  <form method="POST" action="?/create" class="form-grid" use:enhance={() => { creating = true; return async ({ update }) => { await update(); }; }}>
    <label><span>Name</span><input type="text" name="name" placeholder="My webhook" /></label>
    <label><span>Endpoint URL</span><input type="text" name="endpoint" placeholder="https://..." required /></label>
    <label><span>Description</span><input type="text" name="description" placeholder="Optional" /></label>
    <label>
      <span>Triggers (comma-separated)</span>
      <input type="text" name="subscribers" placeholder="user.created, client.deleted" required />
      <small style="color: var(--text-muted); font-size: 0.78rem;">Available: {ALL_TRIGGERS.join(', ')}</small>
    </label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creating}>
      {creating ? 'Creating...' : 'Create webhook'}
    </button>
  </form>
</Dialog>

<!-- ── Edit ────────────────────────────────────────────────── -->
<Dialog bind:open={showEdit} title="Edit webhook">
  {#if editWebhook}
    <form method="POST" action="?/update" class="form-grid" use:enhance={() => { editing = true; return async ({ update }) => { await update(); }; }}>
      <input type="hidden" name="id" value={editWebhook.id} />
      <label><span>Name</span><input type="text" name="name" value={editWebhook.name ?? ''} /></label>
      <label><span>Endpoint URL</span><input type="text" name="endpoint" value={editWebhook.endpoint} required /></label>
      <label><span>Description</span><input type="text" name="description" value={editWebhook.description ?? ''} /></label>
      <label>
        <span>Triggers (comma-separated)</span>
        <input type="text" name="subscribers" value={editWebhook.subscribers.join(', ')} required />
      </label>
      <button type="submit" class="form-grid__submit" use:ripple disabled={editing}>
        {editing ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  {/if}
</Dialog>

<!-- ── Delete ──────────────────────────────────────────────── -->
{#if deleteTarget}
  <ConfirmDelete
    bind:open={showDeleteConfirm}
    message={`Delete webhook "${deleteTarget.name || deleteTarget.endpoint}"? This is irreversible.`}
    confirming={deleting}
    onconfirm={() => {
      if (!deleteTarget) return;
      deleting = true;
      const f = document.createElement('form');
      f.method = 'POST'; f.action = '?/delete'; f.style.display = 'none';
      const input = document.createElement('input');
      input.name = 'id'; input.value = deleteTarget.id;
      f.appendChild(input);
      document.body.appendChild(f);
      f.submit();
    }}
  />
{/if}

<style>
  .webhooks-page, .webhooks-page__stack { display: grid; gap: 24px; }

  .webhooks-page__hero {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: 20px; padding: 24px;
  }

  p, span, small { margin: 0; color: var(--text-muted); }

  h2 {
    margin: 8px 0 10px;
    font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display);
    letter-spacing: -0.05em;
  }

  .webhooks-page__hero-actions { display: grid; gap: 12px; justify-items: end; }
  .webhooks-page__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .webhooks-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }

  .webhooks-page__cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 16px; border-radius: 16px;
    background: var(--primary); color: white;
    border: 0; font-weight: 700; cursor: pointer;
  }

  .webhooks-page__search {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 16px; border-radius: 16px;
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-md);
  }
  .webhooks-page__search input { border: 0; outline: 0; background: transparent; min-width: 220px; color: var(--text); }

  .webhook-list { display: grid; gap: 8px; }

  .webhook-row {
    display: grid; grid-template-columns: 1fr auto auto;
    align-items: center; gap: 16px; padding: 16px;
    border-radius: 18px; background: var(--bg-inset); border: 1px solid var(--border);
    cursor: pointer; transition: border-color 160ms ease;
  }
  .webhook-row:hover { border-color: var(--border-strong); }
  .webhook-row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

  .webhook-row__identity { display: flex; align-items: center; gap: 14px; }
  .webhook-row__identity > span {
    display: grid; place-items: center; width: 42px; height: 42px;
    border-radius: 14px; background: var(--primary-soft); color: var(--primary);
  }
  strong { color: var(--text); }

  .webhook-row__subs { font-size: 0.88rem; color: var(--text-soft); font-weight: 600; }

  .webhook-row__actions { display: flex; gap: 6px; }
  .webhook-row__actions button {
    display: grid; place-items: center; width: 32px; height: 32px;
    border-radius: 10px; border: 1px solid var(--border); background: var(--surface);
    color: var(--text-muted); cursor: pointer;
  }
  .webhook-row__actions button:hover { color: var(--text); }

  .webhooks-page__empty { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); }
  .webhooks-page__empty--compact { padding: 0; background: transparent; border: 0; }

  .webhooks-page__detail-grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
  }
  .webhooks-page__detail-grid div {
    display: grid; gap: 4px; padding: 16px; border-radius: 18px;
    background: var(--bg-inset); border: 1px solid var(--border);
  }

  .webhooks-page__chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .webhooks-page__chips span {
    padding: 8px 12px; border-radius: 999px;
    background: color-mix(in srgb, var(--success) 12%, transparent);
    color: var(--success); font-size: 0.82rem; font-weight: 700;
  }

  @media (max-width: 1000px) {
    .webhooks-page__metrics, .webhooks-page__content, .webhooks-page__detail-grid { grid-template-columns: 1fr; }
    .webhooks-page__hero { flex-direction: column; align-items: flex-start; }
  }
</style>

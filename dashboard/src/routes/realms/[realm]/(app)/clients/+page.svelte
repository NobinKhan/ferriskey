<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import {
    AppWindow,
    Lock,
    Globe,
    Search,
    Plus,
    Pencil,
    Trash2,
    ToggleLeft,
    ToggleRight,
    ShieldCheck,
    Key,
    Eye
  } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';
  import Dialog from '$components/Dialog.svelte';
  import ConfirmDelete from '$components/ConfirmDelete.svelte';
  import { showToast } from '$lib/stores/toast';
  import { ripple } from '$utils/ripple';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const filters = ['All', 'Confidential', 'Public'];
  let activeFilter = $state('All');
  let searchTerm = $state('');

  /* ── Create dialog ──────────────────────────────────────── */
  let showCreate = $state(false);
  let creating = $state(false);

  /* ── Edit dialog ────────────────────────────────────────── */
  let showEdit = $state(false);
  let editClient = $state<PageData['clients'][number] | null>(null);
  let editing = $state(false);

  /* ── Delete dialog ──────────────────────────────────────── */
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<PageData['clients'][number] | null>(null);
  let deleting = $state(false);

  /* ── React to form action results ───────────────────────── */
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

  /* ── Helpers ────────────────────────────────────────────── */
  function clientTypeLabel(client: PageData['clients'][number]) {
    if (client.public_client) return 'Public';
    return 'Confidential';
  }

  function clientTypeTone(client: PageData['clients'][number]) {
    if (client.public_client) return 'primary';
    return 'success';
  }

  function formatDate(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }

  /* ── Metrics ────────────────────────────────────────────── */
  const totalClients = $derived(data.clients.length);
  const confidentialCount = $derived(data.clients.filter((c) => !c.public_client).length);
  const publicCount = $derived(data.clients.filter((c) => c.public_client).length);
  const enabledCount = $derived(data.clients.filter((c) => c.enabled).length);

  /* ── Filtered list ──────────────────────────────────────── */
  const visibleClients = $derived.by(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.clients.filter((c) => {
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Confidential' && !c.public_client) ||
        (activeFilter === 'Public' && c.public_client);
      if (!matchesFilter) return false;
      if (!term) return true;
      return [c.name, c.client_id, c.protocol].some((v) => v.toLowerCase().includes(term));
    });
  });

  let selectedId = $state<string | null>(null);
  const selectedClient = $derived(
    selectedId ? data.clients.find((c) => c.id === selectedId) ?? visibleClients[0] ?? null : visibleClients[0] ?? null
  );
</script>

<div class="clients-page">
  <!-- ── Hero ──────────────────────────────────────────────── -->
  <section class="clients-page__hero glass-panel">
    <div>
      <p>Client registry</p>
      <h2>Applications & services — register, manage, secure.</h2>
      <span>Create OAuth 2.0 clients, review protocol settings, and manage credentials.</span>
    </div>
    <div class="clients-page__hero-actions">
      <ChipTabs items={filters} active={activeFilter} tone="soft" onselect={(item) => (activeFilter = item)} />
      <button type="button" class="clients-page__cta" use:ripple onclick={() => (showCreate = true)}>
        <Plus size={16} />
        Create client
      </button>
    </div>
  </section>

  <!-- ── Metrics ───────────────────────────────────────────── -->
  <section class="clients-page__metrics">
    <MetricCard title="Total clients" value={String(totalClients)} delta={`${enabledCount} enabled`} meta={`${totalClients - enabledCount} disabled`}>
      {#snippet icon()}<AppWindow size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Confidential" value={String(confidentialCount)} delta="Server-side flow" meta="client_credentials / authorization_code" tone="primary">
      {#snippet icon()}<Lock size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Public" value={String(publicCount)} delta="Browser / mobile" meta="implicit / device_code" tone="success">
      {#snippet icon()}<Globe size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <!-- ── Content ───────────────────────────────────────────── -->
  <section class="clients-page__content">
    <SectionCard eyebrow="Registry" title="Manage clients" description="Browse, edit, or remove OAuth clients.">
      {#snippet actions()}
        <label class="clients-page__search">
          <Search size={16} />
          <input type="search" placeholder="Search by name, client ID..." bind:value={searchTerm} />
        </label>
      {/snippet}

      <div class="clients-table">
        {#if visibleClients.length > 0}
          {#each visibleClients as client (client.id)}
            <div
              class="clients-table__row"
              class:clients-table__row--selected={selectedClient?.id === client.id}
              role="button"
              tabindex="0"
              onclick={() => (selectedId = client.id)}
              onkeydown={(e) => e.key === 'Enter' && (selectedId = client.id)}
            >
              <div class="clients-table__identity">
                <span><AppWindow size={18} /></span>
                <div>
                  <strong>{client.name}</strong>
                  <small>{client.client_id}</small>
                </div>
              </div>
              <div class="clients-table__badge clients-table__badge--{clientTypeTone(client)}">{clientTypeLabel(client)}</div>
              <div class="clients-table__status" class:clients-table__status--disabled={!client.enabled}>
                {client.enabled ? 'Enabled' : 'Disabled'}
              </div>
              <div class="clients-table__actions">
                <a href="/realms/{page.params.realm}/clients/{client.id}" aria-label="View" class="clients-table__action-link" onclick={(e: MouseEvent) => e.stopPropagation()} use:ripple>
                  <Eye size={14} />
                </a>
                <button type="button" aria-label="Edit" onclick={(e: MouseEvent) => { e.stopPropagation(); editClient = client; showEdit = true; }} use:ripple>
                  <Pencil size={14} />
                </button>
                <button type="button" aria-label="Delete" onclick={(e: MouseEvent) => { e.stopPropagation(); deleteTarget = client; showDeleteConfirm = true; }} use:ripple>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="clients-page__empty">
            <strong>No clients match this view.</strong>
            <small>Try a broader filter or clear the search.</small>
          </div>
        {/if}
      </div>
    </SectionCard>

    <!-- ── Detail sidebar ──────────────────────────────────── -->
    <div class="clients-page__stack">
      <SectionCard eyebrow="Details" title="Selected client" compact={true}>
        {#if selectedClient}
          <div class="clients-page__detail-grid">
            <div><span>Name</span><strong>{selectedClient.name}</strong></div>
            <div><span>Client ID</span><strong>{selectedClient.client_id}</strong></div>
            <div><span>Type</span><strong>{clientTypeLabel(selectedClient)}</strong></div>
            <div><span>Protocol</span><strong>{selectedClient.protocol}</strong></div>
            <div><span>Status</span><strong>{selectedClient.enabled ? 'Enabled' : 'Disabled'}</strong></div>
            <div><span>Created</span><strong>{formatDate(selectedClient.created_at)}</strong></div>
          </div>
        {:else}
          <div class="clients-page__empty clients-page__empty--compact">
            <strong>No client selected.</strong>
          </div>
        {/if}
      </SectionCard>

      <SectionCard eyebrow="Features" title="Capabilities" compact={true}>
        {#if selectedClient}
          <div class="clients-page__capabilities">
            <div class:active={selectedClient.service_account_enabled}>
              <ShieldCheck size={16} />
              Service account
            </div>
            <div class:active={selectedClient.direct_access_grants_enabled}>
              <Key size={16} />
              Direct access grants
            </div>
          </div>
        {/if}
      </SectionCard>
    </div>
  </section>
</div>

<!-- ── Create client dialog ────────────────────────────────── -->
<Dialog bind:open={showCreate} title="Create client">
  <form method="POST" action="?/create" class="form-grid" use:enhance={() => { creating = true; return async ({ update }) => { await update(); }; }}>
    <label>
      <span>Name</span>
      <input type="text" name="name" placeholder="My App" required />
    </label>
    <label>
      <span>Client ID</span>
      <input type="text" name="client_id" placeholder="my-app" required />
    </label>
    <label>
      <span>Protocol</span>
      <select name="protocol">
        <option value="openid-connect" selected>OpenID Connect</option>
      </select>
    </label>
    <label>
      <span>Client type</span>
      <select name="client_type">
        <option value="confidential" selected>Confidential</option>
        <option value="public">Public</option>
      </select>
    </label>
    <label class="form-grid__checkbox">
      <input type="checkbox" name="service_account_enabled" />
      <span>Service account enabled</span>
    </label>
    <label class="form-grid__checkbox">
      <input type="checkbox" name="direct_access_grants_enabled" checked />
      <span>Direct access grants</span>
    </label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creating}>
      {creating ? 'Creating...' : 'Create client'}
    </button>
  </form>
</Dialog>

<!-- ── Edit client dialog ──────────────────────────────────── -->
<Dialog bind:open={showEdit} title="Edit client">
  {#if editClient}
    <form method="POST" action="?/update" class="form-grid" use:enhance={() => { editing = true; return async ({ update }) => { await update(); }; }}>
      <input type="hidden" name="id" value={editClient.id} />
      <label>
        <span>Name</span>
        <input type="text" name="name" value={editClient.name} />
      </label>
      <label>
        <span>Client ID</span>
        <input type="text" name="client_id_val" value={editClient.client_id} />
      </label>
      <label class="form-grid__checkbox">
        <input type="checkbox" name="enabled" checked={editClient.enabled} />
        <span>Enabled</span>
      </label>
      <label class="form-grid__checkbox">
        <input type="checkbox" name="direct_access_grants_enabled" checked={editClient.direct_access_grants_enabled} />
        <span>Direct access grants</span>
      </label>
      <button type="submit" class="form-grid__submit" use:ripple disabled={editing}>
        {editing ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  {/if}
</Dialog>

<!-- ── Delete confirm ──────────────────────────────────────── -->
{#if deleteTarget}
  <ConfirmDelete
    bind:open={showDeleteConfirm}
    message={`Are you sure you want to delete "${deleteTarget.name}"? This is irreversible.`}
    confirming={deleting}
    onconfirm={() => {
      if (!deleteTarget) return;
      deleting = true;
      const f = document.createElement('form');
      f.method = 'POST';
      f.action = '?/delete';
      f.style.display = 'none';
      const input = document.createElement('input');
      input.name = 'id';
      input.value = deleteTarget.id;
      f.appendChild(input);
      document.body.appendChild(f);
      f.submit();
    }}
  />
{/if}

<style>
  .clients-page, .clients-page__stack { display: grid; gap: 24px; }

  .clients-page__hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    padding: 24px;
  }

  p, span, small { margin: 0; color: var(--text-muted); }

  h2 {
    margin: 8px 0 10px;
    font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display);
    letter-spacing: -0.05em;
  }

  .clients-page__hero-actions { display: grid; gap: 12px; justify-items: end; }
  .clients-page__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .clients-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }

  .clients-page__cta, .clients-page__search {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 13px 16px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
  }

  .clients-page__cta { font-weight: 700; background: var(--primary); color: white; border-color: transparent; cursor: pointer; }
  .clients-page__search input { border: 0; outline: 0; background: transparent; min-width: 220px; color: var(--text); }

  .clients-table { display: grid; gap: 12px; }

  .clients-table__row {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) auto auto auto;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }

  .clients-table__row:hover { border-color: var(--border-strong); }
  .clients-table__row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

  .clients-table__identity { display: flex; align-items: center; gap: 14px; }
  .clients-table__identity > span {
    display: grid; place-items: center; width: 42px; height: 42px;
    border-radius: 14px; background: var(--primary-soft); color: var(--primary);
  }

  strong { color: var(--text); }

  .clients-table__badge, .clients-table__status {
    padding: 6px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 700; justify-self: start;
  }

  .clients-table__badge--success { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .clients-table__badge--primary { background: var(--primary-soft); color: var(--primary); }
  .clients-table__status { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .clients-table__status--disabled { background: color-mix(in srgb, var(--text-muted) 14%, transparent); color: var(--text-muted); }

  .clients-table__actions { display: flex; gap: 6px; }
  .clients-table__actions button,
  .clients-table__actions .clients-table__action-link {
    display: grid; place-items: center; width: 32px; height: 32px;
    border-radius: 10px; border: 1px solid var(--border); background: var(--surface);
    color: var(--text-muted); cursor: pointer; transition: color 140ms ease;
    text-decoration: none;
  }
  .clients-table__actions button:hover,
  .clients-table__actions .clients-table__action-link:hover { color: var(--text); border-color: var(--border-strong); }

  .clients-page__empty { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); }
  .clients-page__empty--compact { padding: 0; background: transparent; border: 0; }

  .clients-page__detail-grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
  }

  .clients-page__detail-grid div {
    display: grid; gap: 4px; padding: 16px; border-radius: 18px;
    background: var(--bg-inset); border: 1px solid var(--border);
  }

  .clients-page__capabilities { display: grid; gap: 8px; }
  .clients-page__capabilities div {
    display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    border-radius: 14px; background: var(--bg-inset); border: 1px solid var(--border);
    color: var(--text-muted); font-size: 0.9rem;
  }
  .clients-page__capabilities div.active { color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, transparent); }

  :global(.form-grid select) {
    width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border);
    background: var(--surface-strong); color: var(--text); outline: 0; font: inherit;
  }

  @media (max-width: 1000px) {
    .clients-page__metrics,
    .clients-page__content,
    .clients-page__detail-grid,
    .clients-table__row { grid-template-columns: 1fr; }
    .clients-page__hero { flex-direction: column; align-items: flex-start; }
  }
</style>

<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { Waypoints, Search, Plus, Trash2, Zap, RefreshCcw, Database, ShieldCheck } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';
  import Dialog from '$components/Dialog.svelte';
  import ConfirmDelete from '$components/ConfirmDelete.svelte';
  import { showToast } from '$lib/stores/toast';
  import { ripple } from '$utils/ripple';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let searchTerm = $state('');
  let showCreate = $state(false);
  let creating = $state(false);
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<PageData['providers'][number] | null>(null);
  let deleting = $state(false);

  $effect(() => {
    if (form && typeof form === 'object') {
      const f = form as Record<string, unknown>;
      if (f.success && typeof f.message === 'string') { showToast(f.message, 'success'); showCreate = false; showDeleteConfirm = false; }
      else if (typeof f.error === 'string') showToast(f.error, 'error');
      creating = false; deleting = false;
    }
  });

  const PROVIDER_TYPES = ['Ldap', 'Kerberos', 'ActiveDirectory'];
  const visible = $derived.by(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return data.providers;
    return data.providers.filter((p) => [p.name, p.provider_type].some((v) => v.toLowerCase().includes(t)));
  });
  let selectedId = $state<string | null>(null);
  const selected = $derived(selectedId ? data.providers.find((p) => p.id === selectedId) ?? visible[0] ?? null : visible[0] ?? null);
</script>

<div class="fed-page">
  <section class="fed-page__hero glass-panel">
    <div>
      <p>Abyss — User Federation</p>
      <h2>User stores — connect, synchronize, unify.</h2>
      <span>Link external user stores like LDAP and Active Directory.</span>
    </div>
    <button type="button" class="cta-btn" use:ripple onclick={() => (showCreate = true)}><Plus size={16} /> Add provider</button>
  </section>

  <section class="fed-page__metrics">
    <MetricCard title="Providers" value={String(data.providers.length)} delta="connected" meta="federation sources">
      {#snippet icon()}<Waypoints size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Enabled" value={String(data.providers.filter((p) => p.enabled).length)} delta="active" meta="syncing users" tone="success">
      {#snippet icon()}<ShieldCheck size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Types" value={String(new Set(data.providers.map((p) => p.provider_type)).size)} delta="provider kinds" meta="configured" tone="primary">
      {#snippet icon()}<Database size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="fed-page__content">
    <SectionCard eyebrow="Registry" title="Federation providers" description="Manage external user stores.">
      {#snippet actions()}
        <label class="fed-page__search"><Search size={16} /><input type="search" placeholder="Search..." bind:value={searchTerm} /></label>
      {/snippet}
      <div class="item-list">
        {#if visible.length > 0}
          {#each visible as provider (provider.id)}
            <div class="item-row" class:item-row--selected={selected?.id === provider.id} role="button" tabindex="0"
              onclick={() => (selectedId = provider.id)} onkeydown={(e) => e.key === 'Enter' && (selectedId = provider.id)}>
              <div class="item-row__icon"><Database size={18} /></div>
              <div class="item-row__info">
                <strong>{provider.name}</strong>
                <small>{provider.provider_type} · Priority {provider.priority} · {provider.enabled ? 'Enabled' : 'Disabled'}</small>
              </div>
              <div class="item-row__actions">
                <form method="POST" action="?/test-connection" use:enhance><input type="hidden" name="id" value={provider.id} />
                  <button type="submit" aria-label="Test" use:ripple onclick={(e: MouseEvent) => e.stopPropagation()}><Zap size={14} /></button>
                </form>
                <form method="POST" action="?/sync-users" use:enhance><input type="hidden" name="id" value={provider.id} />
                  <button type="submit" aria-label="Sync" use:ripple onclick={(e: MouseEvent) => e.stopPropagation()}><RefreshCcw size={14} /></button>
                </form>
                <button type="button" use:ripple onclick={(e: MouseEvent) => { e.stopPropagation(); deleteTarget = provider; showDeleteConfirm = true; }}><Trash2 size={14} /></button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No federation providers.</strong><small>Add an LDAP or AD provider to import external users.</small></div>
        {/if}
      </div>
    </SectionCard>

    <SectionCard eyebrow="Details" title="Selected provider" compact={true}>
      {#if selected}
        <div class="detail-grid">
          <div><span>Name</span><strong>{selected.name}</strong></div>
          <div><span>Type</span><strong>{selected.provider_type}</strong></div>
          <div><span>Priority</span><strong>{selected.priority}</strong></div>
          <div><span>Enabled</span><strong>{selected.enabled ? 'Yes' : 'No'}</strong></div>
        </div>
      {:else}
        <div class="empty-state--compact"><strong>No provider selected.</strong></div>
      {/if}
    </SectionCard>
  </section>
</div>

<Dialog bind:open={showCreate} title="Add federation provider">
  <form method="POST" action="?/create" class="form-grid" use:enhance={() => { creating = true; return async ({ update }) => { await update(); }; }}>
    <label><span>Name</span><input type="text" name="name" placeholder="Corporate LDAP" required /></label>
    <label><span>Type</span><select name="provider_type" required>{#each PROVIDER_TYPES as t (t)}<option value={t}>{t}</option>{/each}</select></label>
    <label><span>Priority</span><input type="number" name="priority" value="0" /></label>
    <label><span>Sync mode</span><select name="sync_mode"><option value="Import">Import</option><option value="Unlinked">Unlinked</option><option value="Force">Force</option></select></label>
    <label class="form-grid__checkbox"><input type="checkbox" name="enabled" checked /><span>Enabled</span></label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creating}>{creating ? 'Creating...' : 'Create provider'}</button>
  </form>
</Dialog>

{#if deleteTarget}
  <ConfirmDelete bind:open={showDeleteConfirm} message={`Delete provider "${deleteTarget.name}"?`} confirming={deleting}
    onconfirm={() => { deleting = true; const f = document.createElement('form'); f.method = 'POST'; f.action = '?/delete'; f.style.display = 'none'; const i = document.createElement('input'); i.name = 'id'; i.value = deleteTarget?.id ?? ''; f.appendChild(i); document.body.appendChild(f); f.submit(); }} />
{/if}

<style>
  .fed-page { display: grid; gap: 24px; }
  .fed-page__hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 24px; }
  p, span, small { margin: 0; color: var(--text-muted); }
  h2 { margin: 8px 0 10px; font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display); letter-spacing: -0.05em; }
  .fed-page__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .fed-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }
  .cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 16px; border-radius: 16px; border: 0; background: var(--primary); color: white; font-weight: 700; cursor: pointer; }
  .fed-page__search { display: inline-flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
  .fed-page__search input { border: 0; outline: 0; background: transparent; min-width: 180px; color: var(--text); }
  .item-list { display: grid; gap: 8px; }
  .item-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; background: var(--bg-inset); border: 1px solid var(--border); cursor: pointer; transition: border-color 160ms ease; }
  .item-row:hover { border-color: var(--border-strong); }
  .item-row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
  .item-row__icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 14px; background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .item-row__info { flex: 1; display: grid; gap: 2px; }
  .item-row__info strong { color: var(--text); }
  .item-row__actions { display: flex; gap: 6px; }
  .item-row__actions button, .item-row__actions form button { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer; }
  .item-row__actions button:hover { color: var(--text); }
  .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .detail-grid div { display: grid; gap: 4px; padding: 16px; border-radius: 18px; background: var(--bg-inset); border: 1px solid var(--border); }
  .empty-state { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); display: grid; gap: 4px; }
  .empty-state strong { color: var(--text); }
  .empty-state--compact strong { color: var(--text); }
  :global(.form-grid select) { width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-strong); color: var(--text); outline: 0; font: inherit; }
  @media (max-width: 1000px) { .fed-page__metrics, .fed-page__content, .detail-grid { grid-template-columns: 1fr; } .fed-page__hero { flex-direction: column; align-items: flex-start; } }
</style>

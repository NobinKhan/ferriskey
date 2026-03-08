<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { Network, Search, Plus, Pencil, Trash2, ShieldCheck, Globe } from 'lucide-svelte';
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
  let showEdit = $state(false);
  let editProvider = $state<PageData['providers'][number] | null>(null);
  let editing = $state(false);
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<PageData['providers'][number] | null>(null);
  let deleting = $state(false);

  $effect(() => {
    if (form && typeof form === 'object') {
      const f = form as Record<string, unknown>;
      if (f.success && typeof f.message === 'string') {
        showToast(f.message, 'success');
        showCreate = false; showEdit = false; showDeleteConfirm = false;
      } else if (typeof f.error === 'string') showToast(f.error, 'error');
      creating = false; editing = false; deleting = false;
    }
  });

  const PROVIDER_TYPES = ['google', 'github', 'oidc', 'saml', 'facebook', 'apple', 'microsoft'];
  const visible = $derived.by(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return data.providers;
    return data.providers.filter((p) => [p.alias, p.display_name ?? '', p.provider_id].some((v) => v.toLowerCase().includes(t)));
  });
  let selectedId = $state<string | null>(null);
  const selected = $derived(selectedId ? data.providers.find((p) => p.id === selectedId) ?? visible[0] ?? null : visible[0] ?? null);
</script>

<div class="idp-page">
  <section class="idp-page__hero glass-panel">
    <div>
      <p>Abyss — Identity Providers</p>
      <h2>External login — connect, trust, federate.</h2>
      <span>Configure social and enterprise identity providers for SSO.</span>
    </div>
    <button type="button" class="cta-btn" use:ripple onclick={() => (showCreate = true)}>
      <Plus size={16} /> Add provider
    </button>
  </section>

  <section class="idp-page__metrics">
    <MetricCard title="Providers" value={String(data.providers.length)} delta="configured" meta="identity providers">
      {#snippet icon()}<Network size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Enabled" value={String(data.providers.filter((p) => p.enabled).length)} delta="active" meta="accepting logins" tone="success">
      {#snippet icon()}<ShieldCheck size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Types" value={String(new Set(data.providers.map((p) => p.provider_id)).size)} delta="unique" meta="provider types" tone="primary">
      {#snippet icon()}<Globe size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="idp-page__content">
    <SectionCard eyebrow="Registry" title="Identity providers" description="Manage external authentication sources.">
      {#snippet actions()}
        <label class="idp-page__search"><Search size={16} /><input type="search" placeholder="Search..." bind:value={searchTerm} /></label>
      {/snippet}
      <div class="item-list">
        {#if visible.length > 0}
          {#each visible as provider (provider.id)}
            <div class="item-row" class:item-row--selected={selected?.id === provider.id} role="button" tabindex="0"
              onclick={() => (selectedId = provider.id)} onkeydown={(e) => e.key === 'Enter' && (selectedId = provider.id)}>
              <div class="item-row__icon"><Globe size={18} /></div>
              <div class="item-row__info">
                <strong>{provider.display_name ?? provider.alias}</strong>
                <small>{provider.provider_id} · {provider.enabled ? 'Enabled' : 'Disabled'}</small>
              </div>
              <div class="item-row__actions">
                <button type="button" use:ripple onclick={(e: MouseEvent) => { e.stopPropagation(); editProvider = provider; showEdit = true; }}><Pencil size={14} /></button>
                <button type="button" use:ripple onclick={(e: MouseEvent) => { e.stopPropagation(); deleteTarget = provider; showDeleteConfirm = true; }}><Trash2 size={14} /></button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No identity providers.</strong><small>Add one to enable social or enterprise SSO.</small></div>
        {/if}
      </div>
    </SectionCard>

    <SectionCard eyebrow="Details" title="Selected provider" compact={true}>
      {#if selected}
        <div class="detail-grid">
          <div><span>Alias</span><strong>{selected.alias}</strong></div>
          <div><span>Provider</span><strong>{selected.provider_id}</strong></div>
          <div><span>Display name</span><strong>{selected.display_name ?? '—'}</strong></div>
          <div><span>Enabled</span><strong>{selected.enabled ? 'Yes' : 'No'}</strong></div>
          <div><span>Trust email</span><strong>{selected.trust_email ? 'Yes' : 'No'}</strong></div>
          <div><span>Link only</span><strong>{selected.link_only ? 'Yes' : 'No'}</strong></div>
        </div>
      {:else}
        <div class="empty-state--compact"><strong>No provider selected.</strong></div>
      {/if}
    </SectionCard>
  </section>
</div>

<Dialog bind:open={showCreate} title="Add identity provider">
  <form method="POST" action="?/create" class="form-grid" use:enhance={() => { creating = true; return async ({ update }) => { await update(); }; }}>
    <label><span>Alias</span><input type="text" name="alias" placeholder="e.g. google-login" required /></label>
    <label><span>Provider type</span>
      <select name="provider_id" required>
        {#each PROVIDER_TYPES as t (t)}<option value={t}>{t}</option>{/each}
      </select>
    </label>
    <label><span>Display name</span><input type="text" name="display_name" placeholder="Google" /></label>
    <label class="form-grid__checkbox"><input type="checkbox" name="enabled" checked /><span>Enabled</span></label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creating}>{creating ? 'Creating...' : 'Create provider'}</button>
  </form>
</Dialog>

<Dialog bind:open={showEdit} title="Edit identity provider">
  {#if editProvider}
    <form method="POST" action="?/update" class="form-grid" use:enhance={() => { editing = true; return async ({ update }) => { await update(); }; }}>
      <input type="hidden" name="alias" value={editProvider.alias} />
      <label><span>Display name</span><input type="text" name="display_name" value={editProvider.display_name ?? ''} /></label>
      <label class="form-grid__checkbox"><input type="checkbox" name="enabled" checked={editProvider.enabled} /><span>Enabled</span></label>
      <label class="form-grid__checkbox"><input type="checkbox" name="trust_email" checked={editProvider.trust_email} /><span>Trust email</span></label>
      <button type="submit" class="form-grid__submit" use:ripple disabled={editing}>{editing ? 'Saving...' : 'Save changes'}</button>
    </form>
  {/if}
</Dialog>

{#if deleteTarget}
  <ConfirmDelete bind:open={showDeleteConfirm} message={`Delete provider "${deleteTarget.alias}"?`} confirming={deleting}
    onconfirm={() => { deleting = true; const f = document.createElement('form'); f.method = 'POST'; f.action = '?/delete'; f.style.display = 'none'; const i = document.createElement('input'); i.name = 'alias'; i.value = deleteTarget?.alias ?? ''; f.appendChild(i); document.body.appendChild(f); f.submit(); }} />
{/if}

<style>
  .idp-page { display: grid; gap: 24px; }
  .idp-page__hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 24px; }
  p, span, small { margin: 0; color: var(--text-muted); }
  h2 { margin: 8px 0 10px; font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display); letter-spacing: -0.05em; }
  .idp-page__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .idp-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }
  .cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 16px; border-radius: 16px; border: 0; background: var(--primary); color: white; font-weight: 700; cursor: pointer; }
  .idp-page__search { display: inline-flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
  .idp-page__search input { border: 0; outline: 0; background: transparent; min-width: 180px; color: var(--text); }
  .item-list { display: grid; gap: 8px; }
  .item-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; background: var(--bg-inset); border: 1px solid var(--border); cursor: pointer; transition: border-color 160ms ease; }
  .item-row:hover { border-color: var(--border-strong); }
  .item-row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
  .item-row__icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 14px; background: var(--primary-soft); color: var(--primary); }
  .item-row__info { flex: 1; display: grid; gap: 2px; }
  .item-row__info strong { color: var(--text); }
  .item-row__actions { display: flex; gap: 6px; }
  .item-row__actions button { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer; }
  .item-row__actions button:hover { color: var(--text); }
  .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .detail-grid div { display: grid; gap: 4px; padding: 16px; border-radius: 18px; background: var(--bg-inset); border: 1px solid var(--border); }
  .empty-state { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); display: grid; gap: 4px; }
  .empty-state strong { color: var(--text); }
  .empty-state--compact strong { color: var(--text); }
  :global(.form-grid select) { width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-strong); color: var(--text); outline: 0; font: inherit; }
  @media (max-width: 1000px) { .idp-page__metrics, .idp-page__content, .detail-grid { grid-template-columns: 1fr; } .idp-page__hero { flex-direction: column; align-items: flex-start; } }
</style>

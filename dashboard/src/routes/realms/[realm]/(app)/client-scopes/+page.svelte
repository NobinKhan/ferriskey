<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { KeyRound, Search, Plus, Pencil, Trash2, Puzzle, Layers3, ShieldCheck } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';
  import Dialog from '$components/Dialog.svelte';
  import ConfirmDelete from '$components/ConfirmDelete.svelte';
  import { showToast } from '$lib/stores/toast';
  import { ripple } from '$utils/ripple';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const filters = ['All', 'Default', 'Optional'];
  let activeFilter = $state('All');
  let searchTerm = $state('');

  let showCreate = $state(false);
  let creating = $state(false);
  let showEdit = $state(false);
  let editScope = $state<PageData['scopes'][number] | null>(null);
  let editing = $state(false);
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<PageData['scopes'][number] | null>(null);
  let deleting = $state(false);
  let showCreateMapper = $state(false);
  let creatingMapper = $state(false);

  const MAPPER_TYPES = ['oidc-usermodel-attribute-mapper', 'oidc-usermodel-realm-role-mapper', 'oidc-usermodel-client-role-mapper', 'oidc-address-mapper', 'oidc-hardcoded-claim-mapper', 'oidc-audience-mapper', 'oidc-full-name-mapper', 'oidc-sha256-pairwise-sub-mapper'];
  const PROTOCOLS = ['openid-connect', 'saml'];

  $effect(() => {
    if (form && typeof form === 'object') {
      const f = form as Record<string, unknown>;
      if (f.success && typeof f.message === 'string') {
        showToast(f.message, 'success');
        showCreate = false; showEdit = false; showDeleteConfirm = false; showCreateMapper = false;
      } else if (typeof f.error === 'string') showToast(f.error, 'error');
      creating = false; editing = false; deleting = false; creatingMapper = false;
    }
  });

  const visible = $derived.by(() => {
    let items = data.scopes;
    if (activeFilter === 'Default') items = items.filter((s) => s.is_default);
    if (activeFilter === 'Optional') items = items.filter((s) => !s.is_default);
    const t = searchTerm.trim().toLowerCase();
    if (t) items = items.filter((s) => [s.name, s.description ?? '', s.protocol].some((v) => v.toLowerCase().includes(t)));
    return items;
  });

  let selectedId = $state<string | null>(null);
  const selected = $derived(selectedId ? data.scopes.find((s) => s.id === selectedId) ?? visible[0] ?? null : visible[0] ?? null);
  const totalMappers = $derived(data.scopes.reduce((acc, s) => acc + (s.protocol_mappers?.length ?? 0), 0));
</script>

<div class="scopes-page">
  <section class="scopes-page__hero glass-panel">
    <div>
      <p>Aegis — Client Scopes</p>
      <h2>Claims, mappers, and scope assignment.</h2>
      <span>Manage shared scopes and protocol mappers across the realm.</span>
    </div>
    <div class="scopes-page__hero-actions">
      <ChipTabs items={filters} active={activeFilter} tone="soft" onselect={(item) => (activeFilter = item)} />
      <button type="button" class="cta-btn" use:ripple onclick={() => (showCreate = true)}><Plus size={16} /> Create scope</button>
    </div>
  </section>

  <section class="scopes-page__metrics">
    <MetricCard title="Scopes" value={String(data.scopes.length)} delta="total" meta="configured scopes">
      {#snippet icon()}<Layers3 size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Protocol mappers" value={String(totalMappers)} delta="across scopes" meta="claim transformations" tone="success">
      {#snippet icon()}<Puzzle size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Default scopes" value={String(data.scopes.filter((s) => s.is_default).length)} delta="auto-assigned" meta="to new clients" tone="primary">
      {#snippet icon()}<ShieldCheck size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="scopes-page__content">
    <SectionCard eyebrow="Scope registry" title="Reusable scopes" description="Shared scopes with protocol context and mapper count.">
      {#snippet actions()}
        <label class="scopes-page__search"><Search size={16} /><input type="search" placeholder="Search scopes..." bind:value={searchTerm} /></label>
      {/snippet}
      <div class="item-list">
        {#if visible.length > 0}
          {#each visible as scope (scope.id)}
            <div class="item-row" class:item-row--selected={selected?.id === scope.id} role="button" tabindex="0"
              onclick={() => (selectedId = scope.id)} onkeydown={(e) => e.key === 'Enter' && (selectedId = scope.id)}>
              <div class="item-row__icon" class:item-row__icon--default={scope.is_default}><KeyRound size={18} /></div>
              <div class="item-row__info">
                <strong>{scope.name}</strong>
                <small>{scope.protocol} · {scope.is_default ? 'Default' : 'Optional'} · {scope.protocol_mappers?.length ?? 0} mappers</small>
              </div>
              <div class="item-row__actions">
                <button type="button" use:ripple onclick={(e: MouseEvent) => { e.stopPropagation(); editScope = scope; showEdit = true; }}><Pencil size={14} /></button>
                <button type="button" use:ripple onclick={(e: MouseEvent) => { e.stopPropagation(); deleteTarget = scope; showDeleteConfirm = true; }}><Trash2 size={14} /></button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="empty-state"><strong>No scopes found.</strong><small>{data.scopes.length === 0 ? 'Create your first client scope.' : 'No scopes match the filter.'}</small></div>
        {/if}
      </div>
    </SectionCard>

    <div class="scopes-page__stack">
      <SectionCard eyebrow="Details" title={selected?.name ?? 'No scope selected'} compact={true}>
        {#if selected}
          <div class="detail-grid">
            <div><span>Name</span><strong>{selected.name}</strong></div>
            <div><span>Protocol</span><strong>{selected.protocol}</strong></div>
            <div><span>Type</span><strong>{selected.is_default ? 'Default' : 'Optional'}</strong></div>
            <div><span>Description</span><strong>{selected.description ?? '—'}</strong></div>
          </div>
        {:else}
          <div class="empty-detail"><strong>Select a scope to view details.</strong></div>
        {/if}
      </SectionCard>

      {#if selected}
        <SectionCard eyebrow="Protocol mappers" title="Mappers" compact={true}>
          {#snippet actions()}
            <button type="button" class="cta-btn cta-btn--sm" use:ripple onclick={() => (showCreateMapper = true)}><Plus size={14} /> Add</button>
          {/snippet}
          <div class="mapper-list">
            {#if selected.protocol_mappers && selected.protocol_mappers.length > 0}
              {#each selected.protocol_mappers as mapper (mapper.id)}
                <div class="mapper-row">
                  <div class="mapper-row__icon"><Puzzle size={14} /></div>
                  <div class="mapper-row__info">
                    <strong>{mapper.name}</strong>
                    <small>{mapper.mapper_type}</small>
                  </div>
                  <form method="POST" action="?/delete-mapper" use:enhance>
                    <input type="hidden" name="scope_id" value={selected.id} />
                    <input type="hidden" name="mapper_id" value={mapper.id} />
                    <button type="submit" class="mapper-row__delete" use:ripple><Trash2 size={12} /></button>
                  </form>
                </div>
              {/each}
            {:else}
              <div class="empty-detail"><strong>No mappers.</strong></div>
            {/if}
          </div>
        </SectionCard>
      {/if}
    </div>
  </section>
</div>

<!-- ── Create scope ─────────────────────────────────────────── -->
<Dialog bind:open={showCreate} title="Create client scope">
  <form method="POST" action="?/create-scope" class="form-grid" use:enhance={() => { creating = true; return async ({ update }) => { await update(); }; }}>
    <label><span>Name</span><input type="text" name="name" placeholder="e.g. profile" required /></label>
    <label><span>Description</span><input type="text" name="description" placeholder="Optional" /></label>
    <label><span>Protocol</span><select name="protocol" required>{#each PROTOCOLS as p (p)}<option value={p}>{p}</option>{/each}</select></label>
    <label class="form-grid__checkbox"><input type="checkbox" name="is_default" /><span>Default scope (auto-assign to new clients)</span></label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creating}>{creating ? 'Creating...' : 'Create scope'}</button>
  </form>
</Dialog>

<!-- ── Edit scope ───────────────────────────────────────────── -->
<Dialog bind:open={showEdit} title="Edit client scope">
  {#if editScope}
    <form method="POST" action="?/update-scope" class="form-grid" use:enhance={() => { editing = true; return async ({ update }) => { await update(); }; }}>
      <input type="hidden" name="scope_id" value={editScope.id} />
      <label><span>Name</span><input type="text" name="name" value={editScope.name} /></label>
      <label><span>Description</span><input type="text" name="description" value={editScope.description ?? ''} /></label>
      <label><span>Protocol</span><select name="protocol">{#each PROTOCOLS as p (p)}<option value={p} selected={editScope.protocol === p}>{p}</option>{/each}</select></label>
      <label class="form-grid__checkbox"><input type="checkbox" name="is_default" checked={editScope.is_default} /><span>Default scope</span></label>
      <button type="submit" class="form-grid__submit" use:ripple disabled={editing}>{editing ? 'Saving...' : 'Save changes'}</button>
    </form>
  {/if}
</Dialog>

<!-- ── Create mapper ────────────────────────────────────────── -->
<Dialog bind:open={showCreateMapper} title="Add protocol mapper">
  {#if selected}
    <form method="POST" action="?/create-mapper" class="form-grid" use:enhance={() => { creatingMapper = true; return async ({ update }) => { await update(); }; }}>
      <input type="hidden" name="scope_id" value={selected.id} />
      <label><span>Mapper name</span><input type="text" name="name" placeholder="e.g. email-mapper" required /></label>
      <label><span>Mapper type</span><select name="mapper_type" required>{#each MAPPER_TYPES as t (t)}<option value={t}>{t}</option>{/each}</select></label>
      <button type="submit" class="form-grid__submit" use:ripple disabled={creatingMapper}>{creatingMapper ? 'Creating...' : 'Create mapper'}</button>
    </form>
  {/if}
</Dialog>

<!-- ── Delete scope confirm ─────────────────────────────────── -->
{#if deleteTarget}
  <ConfirmDelete bind:open={showDeleteConfirm} message={`Delete scope "${deleteTarget.name}"? All associated mappers will be removed.`} confirming={deleting}
    onconfirm={() => { deleting = true; const f = document.createElement('form'); f.method = 'POST'; f.action = '?/delete-scope'; f.style.display = 'none'; const i = document.createElement('input'); i.name = 'scope_id'; i.value = deleteTarget?.id ?? ''; f.appendChild(i); document.body.appendChild(f); f.submit(); }} />
{/if}

<style>
  .scopes-page, .scopes-page__stack { display: grid; gap: 24px; }
  .scopes-page__hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 24px; }
  .scopes-page__hero-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  p, span, small { margin: 0; color: var(--text-muted); }
  h2 { margin: 8px 0 10px; font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display); letter-spacing: -0.05em; }
  .scopes-page__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .scopes-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }
  .cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 16px; border-radius: 16px; border: 0; background: var(--primary); color: white; font-weight: 700; cursor: pointer; }
  .cta-btn--sm { padding: 8px 12px; border-radius: 12px; font-size: 0.85rem; }
  .scopes-page__search { display: inline-flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
  .scopes-page__search input { border: 0; outline: 0; background: transparent; min-width: 180px; color: var(--text); }
  .item-list, .mapper-list { display: grid; gap: 8px; }
  .item-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; background: var(--bg-inset); border: 1px solid var(--border); cursor: pointer; transition: border-color 160ms ease; }
  .item-row:hover { border-color: var(--border-strong); }
  .item-row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
  .item-row__icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 14px; background: var(--primary-soft); color: var(--primary); flex-shrink: 0; }
  .item-row__icon--default { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .item-row__info { flex: 1; display: grid; gap: 2px; }
  .item-row__info strong { color: var(--text); }
  .item-row__actions { display: flex; gap: 6px; }
  .item-row__actions button { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer; }
  .item-row__actions button:hover { color: var(--text); }
  .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .detail-grid div { display: grid; gap: 4px; padding: 16px; border-radius: 18px; background: var(--bg-inset); border: 1px solid var(--border); }
  .mapper-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 14px; background: var(--bg-inset); border: 1px solid var(--border); }
  .mapper-row__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 10px; background: var(--primary-soft); color: var(--primary); }
  .mapper-row__info { flex: 1; display: grid; gap: 1px; }
  .mapper-row__info strong { font-size: 0.88rem; color: var(--text); }
  .mapper-row__delete { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer; }
  .mapper-row__delete:hover { color: var(--danger); border-color: var(--danger); }
  .empty-state { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); display: grid; gap: 4px; }
  .empty-state strong, .empty-detail strong { color: var(--text); }
  :global(.form-grid select) { width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-strong); color: var(--text); outline: 0; font: inherit; }
  @media (max-width: 1000px) { .scopes-page__metrics, .scopes-page__content, .detail-grid { grid-template-columns: 1fr; } .scopes-page__hero { flex-direction: column; align-items: flex-start; } }
</style>

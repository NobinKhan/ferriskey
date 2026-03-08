<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import {
    Shield,
    Search,
    Plus,
    Pencil,
    Trash2,
    Key,
    Lock
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
  const filters = ['All roles', 'Realm roles', 'Client roles'];
  let activeFilter = $state('All roles');
  let searchTerm = $state('');

  /* ── Create ─────────────────────────────────────────────── */
  let showCreate = $state(false);
  let creating = $state(false);

  /* ── Edit ───────────────────────────────────────────────── */
  let showEdit = $state(false);
  let editRole = $state<PageData['roles'][number] | null>(null);
  let editing = $state(false);

  /* ── Delete ─────────────────────────────────────────────── */
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<PageData['roles'][number] | null>(null);
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
  function roleScope(role: PageData['roles'][number]) {
    return role.client_id ? 'Client' : 'Realm';
  }

  /* ── Metrics ────────────────────────────────────────────── */
  const realmRoles = $derived(data.roles.filter((r) => !r.client_id));
  const clientRoles = $derived(data.roles.filter((r) => Boolean(r.client_id)));
  const totalPerms = $derived(data.roles.reduce((sum, r) => sum + r.permissions.length, 0));

  /* ── Filtered list ──────────────────────────────────────── */
  const visibleRoles = $derived.by(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.roles.filter((r) => {
      const matchesFilter =
        activeFilter === 'All roles' ||
        (activeFilter === 'Realm roles' && !r.client_id) ||
        (activeFilter === 'Client roles' && Boolean(r.client_id));
      if (!matchesFilter) return false;
      if (!term) return true;
      return [r.name, r.description ?? '', ...r.permissions].some(
        (v) => v.toLowerCase().includes(term)
      );
    });
  });

  let selectedId = $state<string | null>(null);
  const selectedRole = $derived(
    selectedId ? data.roles.find((r) => r.id === selectedId) ?? visibleRoles[0] ?? null : visibleRoles[0] ?? null
  );
</script>

<div class="roles-page">
  <!-- ── Hero ──────────────────────────────────────────────── -->
  <section class="roles-page__hero glass-panel">
    <div>
      <p>Access control</p>
      <h2>Roles & permissions — define, assign, enforce.</h2>
      <span>Create realm or client roles and manage their permission sets.</span>
    </div>
    <div class="roles-page__hero-actions">
      <ChipTabs items={filters} active={activeFilter} tone="soft" onselect={(item) => (activeFilter = item)} />
      <button type="button" class="roles-page__cta" use:ripple onclick={() => (showCreate = true)}>
        <Plus size={16} />
        Create role
      </button>
    </div>
  </section>

  <!-- ── Metrics ───────────────────────────────────────────── -->
  <section class="roles-page__metrics">
    <MetricCard title="Total roles" value={String(data.roles.length)} delta={`${realmRoles.length} realm`} meta={`${clientRoles.length} client`}>
      {#snippet icon()}<Shield size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Realm roles" value={String(realmRoles.length)} delta="Global scope" meta="Available across all clients" tone="success">
      {#snippet icon()}<Lock size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Permissions" value={String(totalPerms)} delta="Total assignments" meta="Across all role definitions" tone="primary">
      {#snippet icon()}<Key size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <!-- ── Content ───────────────────────────────────────────── -->
  <section class="roles-page__content">
    <SectionCard eyebrow="Registry" title="Manage roles" description="Browse, edit, or remove roles and their permissions.">
      {#snippet actions()}
        <label class="roles-page__search">
          <Search size={16} />
          <input type="search" placeholder="Search by name, permission..." bind:value={searchTerm} />
        </label>
      {/snippet}

      <div class="roles-table">
        {#if visibleRoles.length > 0}
          {#each visibleRoles as role (role.id)}
            <div
              class="roles-table__row"
              class:roles-table__row--selected={selectedRole?.id === role.id}
              role="button"
              tabindex="0"
              onclick={() => (selectedId = role.id)}
              onkeydown={(e) => e.key === 'Enter' && (selectedId = role.id)}
            >
              <div class="roles-table__identity">
                <span><Shield size={18} /></span>
                <div>
                  <strong>{role.name}</strong>
                  <small>{role.description ?? 'No description'}</small>
                </div>
              </div>
              <div class="roles-table__badge">{roleScope(role)}</div>
              <div class="roles-table__perm-count">{role.permissions.length} perms</div>
              <div class="roles-table__actions">
                <button type="button" aria-label="Edit" onclick={(e: MouseEvent) => { e.stopPropagation(); editRole = role; showEdit = true; }} use:ripple>
                  <Pencil size={14} />
                </button>
                <button type="button" aria-label="Delete" onclick={(e: MouseEvent) => { e.stopPropagation(); deleteTarget = role; showDeleteConfirm = true; }} use:ripple>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="roles-page__empty">
            <strong>No roles match this view.</strong>
            <small>Try a broader filter.</small>
          </div>
        {/if}
      </div>
    </SectionCard>

    <!-- ── Detail sidebar ──────────────────────────────────── -->
    <div class="roles-page__stack">
      <SectionCard eyebrow="Details" title="Selected role" compact={true}>
        {#if selectedRole}
          <div class="roles-page__detail-grid">
            <div><span>Name</span><strong>{selectedRole.name}</strong></div>
            <div><span>Scope</span><strong>{roleScope(selectedRole)}</strong></div>
            <div><span>Description</span><strong>{selectedRole.description ?? '—'}</strong></div>
            <div><span>Permissions</span><strong>{selectedRole.permissions.length}</strong></div>
          </div>
        {:else}
          <div class="roles-page__empty roles-page__empty--compact">
            <strong>No role selected.</strong>
          </div>
        {/if}
      </SectionCard>

      <SectionCard eyebrow="Permissions" title="Permission set" compact={true}>
        {#if selectedRole && selectedRole.permissions.length > 0}
          <div class="roles-page__chips">
            {#each selectedRole.permissions as perm (perm)}
              <span>{perm}</span>
            {/each}
          </div>
        {:else}
          <div class="roles-page__empty roles-page__empty--compact">
            <strong>No permissions assigned.</strong>
          </div>
        {/if}
      </SectionCard>
    </div>
  </section>
</div>

<!-- ── Create role dialog ──────────────────────────────────── -->
<Dialog bind:open={showCreate} title="Create role">
  <form method="POST" action="?/create" class="form-grid" use:enhance={() => { creating = true; return async ({ update }) => { await update(); }; }}>
    <label>
      <span>Role name</span>
      <input type="text" name="name" placeholder="e.g. admin" required />
    </label>
    <label>
      <span>Description</span>
      <input type="text" name="description" placeholder="Optional description" />
    </label>
    <label>
      <span>Permissions (comma-separated)</span>
      <input type="text" name="permissions" placeholder="read, write, manage" />
    </label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creating}>
      {creating ? 'Creating...' : 'Create role'}
    </button>
  </form>
</Dialog>

<!-- ── Edit role dialog ────────────────────────────────────── -->
<Dialog bind:open={showEdit} title="Edit role">
  {#if editRole}
    <form method="POST" action="?/update" class="form-grid" use:enhance={() => { editing = true; return async ({ update }) => { await update(); }; }}>
      <input type="hidden" name="id" value={editRole.id} />
      <label>
        <span>Role name</span>
        <input type="text" name="name" value={editRole.name} />
      </label>
      <label>
        <span>Description</span>
        <input type="text" name="description" value={editRole.description ?? ''} />
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
    message={`Delete role "${deleteTarget.name}"? This is irreversible.`}
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
  .roles-page, .roles-page__stack { display: grid; gap: 24px; }

  .roles-page__hero {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: 20px; padding: 24px;
  }

  p, span, small { margin: 0; color: var(--text-muted); }

  h2 {
    margin: 8px 0 10px;
    font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display);
    letter-spacing: -0.05em;
  }

  .roles-page__hero-actions { display: grid; gap: 12px; justify-items: end; }
  .roles-page__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
  .roles-page__content { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); gap: 24px; }

  .roles-page__cta, .roles-page__search {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 16px; border-radius: 16px; background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-md);
  }

  .roles-page__cta { font-weight: 700; background: var(--primary); color: white; border-color: transparent; cursor: pointer; }
  .roles-page__search input { border: 0; outline: 0; background: transparent; min-width: 220px; color: var(--text); }

  .roles-table { display: grid; gap: 12px; }

  .roles-table__row {
    display: grid; grid-template-columns: minmax(0, 1.2fr) auto auto auto;
    align-items: center; gap: 16px; padding: 16px; border-radius: 18px;
    background: var(--bg-inset); border: 1px solid var(--border);
    cursor: pointer; transition: border-color 160ms ease, box-shadow 160ms ease;
  }

  .roles-table__row:hover { border-color: var(--border-strong); }
  .roles-table__row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

  .roles-table__identity { display: flex; align-items: center; gap: 14px; }
  .roles-table__identity > span {
    display: grid; place-items: center; width: 42px; height: 42px;
    border-radius: 14px; background: var(--primary-soft); color: var(--primary);
  }

  strong { color: var(--text); }

  .roles-table__badge {
    padding: 6px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 700;
    background: var(--primary-soft); color: var(--primary); justify-self: start;
  }

  .roles-table__perm-count {
    font-size: 0.88rem; color: var(--text-soft); font-weight: 600;
  }

  .roles-table__actions { display: flex; gap: 6px; }
  .roles-table__actions button {
    display: grid; place-items: center; width: 32px; height: 32px;
    border-radius: 10px; border: 1px solid var(--border); background: var(--surface);
    color: var(--text-muted); cursor: pointer; transition: color 140ms ease;
  }
  .roles-table__actions button:hover { color: var(--text); border-color: var(--border-strong); }

  .roles-page__empty { padding: 18px; border-radius: 18px; background: var(--bg-inset); border: 1px dashed var(--border); }
  .roles-page__empty--compact { padding: 0; background: transparent; border: 0; }

  .roles-page__detail-grid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
  }

  .roles-page__detail-grid div {
    display: grid; gap: 4px; padding: 16px; border-radius: 18px;
    background: var(--bg-inset); border: 1px solid var(--border);
  }

  .roles-page__chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .roles-page__chips span {
    padding: 8px 12px; border-radius: 999px;
    background: color-mix(in srgb, var(--success) 12%, transparent);
    color: var(--success); font-size: 0.82rem; font-weight: 700;
  }

  @media (max-width: 1000px) {
    .roles-page__metrics,
    .roles-page__content,
    .roles-page__detail-grid,
    .roles-table__row { grid-template-columns: 1fr; }
    .roles-page__hero { flex-direction: column; align-items: flex-start; }
  }
</style>

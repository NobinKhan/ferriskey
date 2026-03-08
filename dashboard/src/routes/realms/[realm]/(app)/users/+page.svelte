<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import {
    Mail,
    Search,
    ShieldCheck,
    UserRoundPlus,
    Users,
    ToggleLeft,
    ToggleRight,
    Pencil,
    Trash2,
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
  const currentRealm = String(page.params.realm ?? 'master');
  const filters = ['All users', 'Members', 'Service accounts'];
  let activeFilter = $state('All users');
  let searchTerm = $state('');

  /* ── Create dialog ──────────────────────────────────────── */
  let showCreate = $state(false);
  let creating = $state(false);

  /* ── Edit dialog ────────────────────────────────────────── */
  let showEdit = $state(false);
  let editUser = $state<PageData['users'][number] | null>(null);
  let editing = $state(false);

  /* ── Delete dialog ──────────────────────────────────────── */
  let showDeleteConfirm = $state(false);
  let deleteTarget = $state<PageData['users'][number] | null>(null);
  let deleting = $state(false);

  /* ── Selected user ──────────────────────────────────────── */
  let selectedUserId = $state<string | null>(null);

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
  function displayName(user: PageData['users'][number]) {
    const full = `${user.firstname} ${user.lastname}`.trim();
    return full || user.username;
  }

  function initials(user: PageData['users'][number]) {
    return displayName(user)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  function accountType(user: PageData['users'][number]) {
    return user.client_id ? 'Service account' : 'Member';
  }

  function accountStatus(user: PageData['users'][number]) {
    if (!user.enabled) return 'Disabled';
    if (user.required_actions.length > 0) return 'Pending action';
    if (user.client_id) return 'Healthy';
    return 'Active';
  }

  function statusTone(user: PageData['users'][number]) {
    if (!user.enabled) return 'muted';
    if (user.required_actions.length > 0) return 'warning';
    return 'success';
  }

  function formatDate(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }

  /* ── Metrics ────────────────────────────────────────────── */
  const membersCount = $derived(data.users.filter((u) => !u.client_id).length);
  const serviceCount = $derived(data.users.filter((u) => Boolean(u.client_id)).length);
  const verifiedCount = $derived(data.users.filter((u) => u.email_verified).length);
  const pendingCount = $derived(data.users.filter((u) => u.required_actions.length > 0).length);
  const verifiedRate = $derived(
    data.users.length === 0 ? '0%' : `${((verifiedCount / data.users.length) * 100).toFixed(1)}%`
  );

  /* ── Filtered list ──────────────────────────────────────── */
  const visibleUsers = $derived.by(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.users.filter((u) => {
      const matchesFilter =
        activeFilter === 'All users' ||
        (activeFilter === 'Members' && !u.client_id) ||
        (activeFilter === 'Service accounts' && Boolean(u.client_id));
      if (!matchesFilter) return false;
      if (!term) return true;
      return [displayName(u), u.email, u.username, ...(u.roles?.map((r) => r.name) ?? [])].some(
        (v) => v.toLowerCase().includes(term)
      );
    });
  });

  const selectedUser = $derived(
    selectedUserId
      ? data.users.find((u) => u.id === selectedUserId) ?? visibleUsers[0] ?? null
      : visibleUsers[0] ?? null
  );
  const selectedRoles = $derived(selectedUser?.roles ?? []);
  const selectedActions = $derived(selectedUser?.required_actions ?? []);
</script>

<div class="users-page">
  <!-- ── Hero ──────────────────────────────────────────────── -->
  <section class="users-page__hero glass-panel">
    <div>
      <p>Users workspace</p>
      <h2>Identity lifecycle — create, review, and manage.</h2>
      <span>Search, review required actions, and inspect roles. Create or remove users inline.</span>
    </div>
    <div class="users-page__hero-actions">
      <ChipTabs items={filters} active={activeFilter} tone="soft" onselect={(item) => (activeFilter = item)} />
      <button type="button" class="users-page__cta" use:ripple onclick={() => (showCreate = true)}>
        <UserRoundPlus size={16} />
        Create user
      </button>
    </div>
  </section>

  <!-- ── Metrics ───────────────────────────────────────────── -->
  <section class="users-page__metrics">
    <MetricCard title="Total users" value={String(data.users.length)} delta={`${membersCount} members`} meta={`${serviceCount} service accounts`}>
      {#snippet icon()}<Users size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Email verified" value={verifiedRate} delta={`${verifiedCount} verified`} meta="live realm verification rate" tone="success">
      {#snippet icon()}<Mail size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard title="Pending actions" value={String(pendingCount)} delta={`${data.users.length - pendingCount} ready`} meta="accounts still blocked on follow-up tasks" tone="primary">
      {#snippet icon()}<ShieldCheck size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <!-- ── Content: list + detail ────────────────────────────── -->
  <section class="users-page__content">
    <SectionCard eyebrow="Directory" title="Search and manage users" description="Browse, edit, enable/disable, or remove identities.">
      {#snippet actions()}
        <label class="users-page__search">
          <Search size={16} />
          <input type="search" placeholder="Search by name, email, role..." bind:value={searchTerm} />
        </label>
      {/snippet}

      <div class="users-table">
        {#if visibleUsers.length > 0}
          {#each visibleUsers as user (user.id)}
            <div
              class="users-table__row"
              class:users-table__row--selected={selectedUser?.id === user.id}
              role="button"
              tabindex="0"
              onclick={() => (selectedUserId = user.id)}
              onkeydown={(e) => e.key === 'Enter' && (selectedUserId = user.id)}
            >
              <div class="users-table__identity">
                <span>{initials(user)}</span>
                <div>
                  <strong>{displayName(user)}</strong>
                  <small>{user.email}</small>
                </div>
              </div>
              <div>
                <strong>{accountType(user)}</strong>
                <small>{user.roles?.map((r) => r.name).join(', ') || user.username}</small>
              </div>
              <div class="users-table__status users-table__status--{statusTone(user)}">{accountStatus(user)}</div>
              <div class="users-table__actions">
                <a
                  href="/realms/{currentRealm}/users/{user.id}"
                  aria-label="View"
                  class="users-table__action-link"
                  onclick={(e: MouseEvent) => e.stopPropagation()}
                  use:ripple
                >
                  <Eye size={14} />
                </a>
                <button
                  type="button"
                  aria-label="Edit"
                  onclick={(e: MouseEvent) => { e.stopPropagation(); editUser = user; showEdit = true; }}
                  use:ripple
                >
                  <Pencil size={14} />
                </button>
                <form method="POST" action="?/toggle-status" use:enhance>
                  <input type="hidden" name="user_id" value={user.id} />
                  <input type="hidden" name="currently_enabled" value={String(user.enabled)} />
                  <input type="hidden" name="firstname" value={user.firstname} />
                  <input type="hidden" name="lastname" value={user.lastname} />
                  <input type="hidden" name="email" value={user.email} />
                  <button type="submit" aria-label={user.enabled ? 'Disable' : 'Enable'} use:ripple>
                    {#if user.enabled}
                      <ToggleRight size={14} />
                    {:else}
                      <ToggleLeft size={14} />
                    {/if}
                  </button>
                </form>
                <button
                  type="button"
                  aria-label="Delete"
                  onclick={(e: MouseEvent) => { e.stopPropagation(); deleteTarget = user; showDeleteConfirm = true; }}
                  use:ripple
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="users-page__empty">
            <strong>No users match this view yet.</strong>
            <small>Try a broader filter or clear the search query.</small>
          </div>
        {/if}
      </div>
    </SectionCard>

    <!-- ── Detail sidebar ──────────────────────────────────── -->
    <div class="users-page__stack">
      <SectionCard eyebrow="Profile" title="Selected identity" description="Quick review of the selected user." compact={true}>
        {#if selectedUser}
          <div class="users-page__profile">
            <div>
              <strong>{displayName(selectedUser)}</strong>
              <small>{selectedRoles.map((r) => r.name).join(', ') || accountType(selectedUser)}</small>
            </div>
            <div class="users-page__profile-grid">
              <div><span>Username</span><strong>{selectedUser.username}</strong></div>
              <div><span>Status</span><strong>{accountStatus(selectedUser)}</strong></div>
              <div><span>Email verified</span><strong>{selectedUser.email_verified ? 'Yes' : 'No'}</strong></div>
              <div><span>Created</span><strong>{formatDate(selectedUser.created_at)}</strong></div>
            </div>
          </div>
        {:else}
          <div class="users-page__empty users-page__empty--compact">
            <strong>No identities loaded.</strong>
            <small>This realm has no users to inspect yet.</small>
          </div>
        {/if}
      </SectionCard>

      <SectionCard eyebrow="Required actions" title="Pending next steps" compact={true}>
        <div class="users-page__chips">
          {#if selectedActions.length > 0}
            {#each selectedActions as action (action)}
              <span>{action}</span>
            {/each}
          {:else}
            <div class="users-page__empty users-page__empty--compact">
              <strong>No follow-up steps.</strong>
              <small>The selected identity is ready to sign in.</small>
            </div>
          {/if}
        </div>
      </SectionCard>

      <SectionCard eyebrow="Role mapping" title="Assigned role sets" compact={true}>
        <div class="users-page__role-list">
          {#if selectedRoles.length > 0}
            {#each selectedRoles as role (role.id)}
              <div>
                <strong>{role.name}</strong>
                <span>{selectedUser?.client_id ? 'Service account scope' : 'Realm scope'}</span>
                <small>{selectedUser?.client_id ? 'Inherited from linked client' : 'Assigned directly'}</small>
              </div>
            {/each}
          {:else}
            <div class="users-page__empty users-page__empty--compact">
              <strong>No explicit roles.</strong>
              <small>Assign role mappings to surface them here.</small>
            </div>
          {/if}
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<!-- ── Create user dialog ──────────────────────────────────── -->
<Dialog bind:open={showCreate} title="Create user">
  <form
    method="POST"
    action="?/create"
    class="form-grid"
    use:enhance={() => {
      creating = true;
      return async ({ update }) => { await update(); };
    }}
  >
    <label>
      <span>Username</span>
      <input type="text" name="username" placeholder="e.g. jdoe" required />
    </label>
    <label>
      <span>First name</span>
      <input type="text" name="firstname" placeholder="Jane" required />
    </label>
    <label>
      <span>Last name</span>
      <input type="text" name="lastname" placeholder="Doe" required />
    </label>
    <label>
      <span>Email</span>
      <input type="email" name="email" placeholder="jane@example.com" required />
    </label>
    <label class="form-grid__checkbox">
      <input type="checkbox" name="email_verified" />
      <span>Email verified</span>
    </label>
    <button type="submit" class="form-grid__submit" use:ripple disabled={creating}>
      {creating ? 'Creating...' : 'Create user'}
    </button>
  </form>
</Dialog>

<!-- ── Edit user dialog ────────────────────────────────────── -->
<Dialog bind:open={showEdit} title="Edit user">
  {#if editUser}
    <form
      method="POST"
      action="?/update"
      class="form-grid"
      use:enhance={() => {
        editing = true;
        return async ({ update }) => { await update(); };
      }}
    >
      <input type="hidden" name="user_id" value={editUser.id} />
      <label>
        <span>First name</span>
        <input type="text" name="firstname" value={editUser.firstname} required />
      </label>
      <label>
        <span>Last name</span>
        <input type="text" name="lastname" value={editUser.lastname} required />
      </label>
      <label>
        <span>Email</span>
        <input type="email" name="email" value={editUser.email} required />
      </label>
      <label class="form-grid__checkbox">
        <input type="checkbox" name="email_verified" checked={editUser.email_verified} />
        <span>Email verified</span>
      </label>
      <label class="form-grid__checkbox">
        <input type="checkbox" name="enabled" checked={editUser.enabled} />
        <span>Enabled</span>
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
    message={`Are you sure you want to delete "${displayName(deleteTarget)}"? This action is irreversible.`}
    confirming={deleting}
    onconfirm={() => {
      if (!deleteTarget) return;
      deleting = true;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `?/delete`;
      form.style.display = 'none';
      const input = document.createElement('input');
      input.name = 'user_id';
      input.value = deleteTarget.id;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }}
  />
{/if}

<style>
  .users-page,
  .users-page__stack,
  .users-page__profile,
  .users-page__role-list {
    display: grid;
    gap: 24px;
  }

  .users-page__hero {
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

  .users-page__hero-actions,
  .users-page__metrics,
  .users-page__content { display: grid; gap: 24px; }

  .users-page__hero-actions { justify-items: end; }

  .users-page__cta,
  .users-page__search {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 13px 16px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
  }

  .users-page__cta {
    font-weight: 700;
    background: var(--primary);
    color: white;
    border-color: transparent;
    cursor: pointer;
  }

  .users-page__metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .users-page__content { grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr); }

  .users-page__search input { border: 0; outline: 0; background: transparent; min-width: 220px; color: var(--text); }

  .users-table,
  .users-page__profile-grid,
  .users-page__chips,
  .users-page__empty { display: grid; gap: 12px; }

  .users-table__row,
  .users-page__profile-grid div,
  .users-page__role-list div {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }

  .users-table__row:hover { border-color: var(--border-strong); }
  .users-table__row--selected { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

  .users-table__row {
    grid-template-columns: minmax(0, 1.1fr) minmax(140px, 0.6fr) auto auto;
    align-items: center;
    gap: 16px;
  }

  .users-table__identity { display: flex; align-items: center; gap: 14px; }

  .users-table__identity > span {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 800;
  }

  strong { color: var(--text); }

  .users-table__status {
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
    justify-self: start;
  }

  .users-table__status--success { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .users-table__status--warning { background: color-mix(in srgb, var(--warning) 14%, transparent); color: var(--warning); }
  .users-table__status--muted   { background: color-mix(in srgb, var(--text-muted) 14%, transparent); color: var(--text-muted); }

  .users-table__actions {
    display: flex;
    gap: 6px;
  }

  .users-table__actions button,
  .users-table__actions .users-table__action-link {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
    transition: color 140ms ease, border-color 140ms ease;
    text-decoration: none;
  }

  .users-table__actions button:hover,
  .users-table__actions .users-table__action-link:hover { color: var(--text); border-color: var(--border-strong); }

  .users-page__empty {
    padding: 18px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px dashed var(--border);
  }

  .users-page__empty--compact { padding: 0; background: transparent; border: 0; }

  .users-page__profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  .users-page__chips span {
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: 0.82rem;
    font-weight: 700;
    justify-self: start;
  }

  .users-page__role-list div {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .users-page__role-list small { justify-self: end; }

  /* ── Form grid (inside dialogs) ────────────────────────── */
  :global(.form-grid) {
    display: grid;
    gap: 16px;
  }

  :global(.form-grid label) {
    display: grid;
    gap: 6px;
  }

  :global(.form-grid label span) {
    color: var(--text-soft);
    font-size: 0.88rem;
    font-weight: 600;
  }

  :global(.form-grid input[type='text']),
  :global(.form-grid input[type='email']) {
    width: 100%;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface-strong);
    color: var(--text);
    outline: 0;
    font: inherit;
  }

  :global(.form-grid input:focus) {
    border-color: color-mix(in srgb, var(--primary) 55%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent);
  }

  :global(.form-grid__checkbox) {
    flex-direction: row !important;
    display: flex !important;
    align-items: center;
    gap: 10px !important;
  }

  :global(.form-grid__checkbox input[type='checkbox']) {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }

  :global(.form-grid__submit) {
    padding: 14px 18px;
    border-radius: 16px;
    border: 0;
    background: var(--primary);
    color: white;
    font-weight: 700;
    cursor: pointer;
  }

  :global(.form-grid__submit:disabled) {
    opacity: 0.6;
    cursor: wait;
  }

  @media (max-width: 1000px) {
    .users-page__metrics,
    .users-page__content,
    .users-page__profile-grid,
    .users-table__row,
    .users-page__role-list div { grid-template-columns: 1fr; }

    .users-page__hero { flex-direction: column; align-items: flex-start; }
    .users-page__hero-actions { justify-items: start; }
  }
</style>

<script lang="ts">
  import type { PageData } from './$types';
  import {
    Mail,
    Search,
    ShieldCheck,
    UserRoundPlus,
    Users
  } from 'lucide-svelte';
  import { page } from '$app/state';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';
  import { ripple } from '$utils/ripple';

  let { data }: { data: PageData } = $props();
  const currentRealm = String(page.params.realm ?? 'master');
  const filters = ['All users', 'Members', 'Service accounts'];
  let activeFilter = $state('All users');
  let searchTerm = $state('');

  function displayName(user: PageData['users'][number]) {
    const fullName = `${user.firstname} ${user.lastname}`.trim();
    return fullName || user.username;
  }

  function initials(user: PageData['users'][number]) {
    return displayName(user)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  function accountType(user: PageData['users'][number]) {
    return user.client_id ? 'Service account' : 'Member';
  }

  function accountStatus(user: PageData['users'][number]) {
    if (!user.enabled) {
      return 'Disabled';
    }

    if (user.required_actions.length > 0) {
      return 'Pending action';
    }

    if (user.client_id) {
      return 'Healthy';
    }

    return 'Active';
  }

  function formatDate(value: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(parsed);
  }

  const membersCount = $derived(data.users.filter((user) => !user.client_id).length);
  const serviceAccountsCount = $derived(
    data.users.filter((user) => Boolean(user.client_id)).length
  );
  const verifiedCount = $derived(data.users.filter((user) => user.email_verified).length);
  const pendingCount = $derived(
    data.users.filter((user) => user.required_actions.length > 0).length
  );
  const verifiedRate = $derived(
    data.users.length === 0
      ? '0%'
      : `${((verifiedCount / data.users.length) * 100).toFixed(1)}%`
  );

  const visibleUsers = $derived.by(() => {
    const term = searchTerm.trim().toLowerCase();

    return data.users.filter((user) => {
      const matchesFilter =
        activeFilter === 'All users' ||
        (activeFilter === 'Members' && !user.client_id) ||
        (activeFilter === 'Service accounts' && Boolean(user.client_id));

      if (!matchesFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        displayName(user),
        user.email,
        user.username,
        ...(user.roles?.map((role) => role.name) ?? [])
      ].some((value) => value.toLowerCase().includes(term));
    });
  });

  const selectedUser = $derived(visibleUsers[0] ?? data.users[0] ?? null);
  const selectedRoles = $derived(selectedUser?.roles ?? []);
  const selectedActions = $derived(selectedUser?.required_actions ?? []);
</script>

<div class="users-page">
  <section class="users-page__hero glass-panel">
    <div>
      <p>Users workspace</p>
      <h2>Identity lifecycle in a calmer, sharper layout.</h2>
      <span
        >Search, review required actions, and inspect roles without jumping
        across a dense legacy table.</span
      >
    </div>
    <div class="users-page__hero-actions">
      <ChipTabs items={filters} active={activeFilter} tone="soft" onselect={(item) => (activeFilter = item)} />
      <a
        href={`/realms/${currentRealm}/users/create`}
        class="users-page__cta"
        use:ripple
      >
        <UserRoundPlus size={16} />
        Create user
      </a>
    </div>
  </section>

  <section class="users-page__metrics">
    <MetricCard
      title="Total users"
      value={String(data.users.length)}
      delta={`${membersCount} members`}
      meta={`${serviceAccountsCount} service accounts`}
    >
      {#snippet icon()}<Users size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Email verified"
      value={verifiedRate}
      delta={`${verifiedCount} verified`}
      meta="live realm verification rate"
      tone="success"
    >
      {#snippet icon()}<Mail size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Pending actions"
      value={String(pendingCount)}
      delta={`${data.users.length - pendingCount} ready`}
      meta="accounts still blocked on follow-up tasks"
      tone="primary"
    >
      {#snippet icon()}<ShieldCheck size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="users-page__content">
    <SectionCard
      eyebrow="Directory"
      title="Search and segment users"
      description="A Barrzen Minimal list view for fast scanning across members and service accounts."
    >
      {#snippet actions()}
        <label class="users-page__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search by name, email, role..."
            bind:value={searchTerm}
          />
        </label>
      {/snippet}

      <div class="users-table">
        {#if visibleUsers.length > 0}
          {#each visibleUsers as user (user.id)}
            <div class="users-table__row">
              <div class="users-table__identity">
                <span>{initials(user)}</span>
                <div>
                  <strong>{displayName(user)}</strong>
                  <small>{user.email}</small>
                </div>
              </div>
              <div>
                <strong>{accountType(user)}</strong>
                <small>{user.roles?.map((role) => role.name).join(', ') || user.username}</small>
              </div>
              <div class="users-table__status">{accountStatus(user)}</div>
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

    <div class="users-page__stack">
      <SectionCard
        eyebrow="Profile"
        title="Selected identity"
        description="A cleaner detail pane for everyday admin review."
        compact={true}
      >
        {#if selectedUser}
          <div class="users-page__profile">
            <div>
              <strong>{displayName(selectedUser)}</strong>
              <small>{selectedRoles.map((role) => role.name).join(', ') || accountType(selectedUser)}</small>
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

      <SectionCard
        eyebrow="Required actions"
        title="Pending next steps"
        compact={true}
      >
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

      <SectionCard
        eyebrow="Role mapping"
        title="Assigned role sets"
        compact={true}
      >
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

  p,
  span,
  small {
    margin: 0;
    color: var(--text-muted);
  }

  h2 {
    margin: 8px 0 10px;
    font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display);
    letter-spacing: -0.05em;
  }

  .users-page__hero-actions,
  .users-page__metrics,
  .users-page__content {
    display: grid;
    gap: 24px;
  }

  .users-page__hero-actions {
    justify-items: end;
  }

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
  }

  .users-page__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .users-page__content {
    grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  }

  .users-page__search input {
    border: 0;
    outline: 0;
    background: transparent;
    min-width: 220px;
  }

  .users-table,
  .users-page__profile-grid,
  .users-page__chips,
  .users-page__empty {
    display: grid;
    gap: 12px;
  }

  .users-table__row,
  .users-page__profile-grid div,
  .users-page__role-list div {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .users-table__row {
    grid-template-columns: minmax(0, 1.1fr) minmax(140px, 0.6fr) 120px;
    align-items: center;
    gap: 16px;
  }

  .users-table__identity {
    display: flex;
    align-items: center;
    gap: 14px;
  }

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

  strong {
    color: var(--text);
  }

  .users-table__status,
  .users-page__chips span {
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: 0.82rem;
    font-weight: 700;
    justify-self: start;
  }

  .users-page__empty {
    padding: 18px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px dashed var(--border);
  }

  .users-page__empty--compact {
    padding: 0;
    background: transparent;
    border: 0;
  }

  .users-page__profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .users-page__role-list div {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .users-page__role-list small {
    justify-self: end;
  }

  @media (max-width: 1000px) {
    .users-page__metrics,
    .users-page__content,
    .users-page__profile-grid,
    .users-table__row,
    .users-page__role-list div {
      grid-template-columns: 1fr;
    }

    .users-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .users-page__hero-actions {
      justify-items: start;
    }
  }
</style>

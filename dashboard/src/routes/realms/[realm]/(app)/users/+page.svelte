<script lang="ts">
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

  const currentRealm = String(page.params.realm ?? 'master');
  const filters = ['All users', 'Members', 'Service accounts'];
  const users = [
    {
      name: 'Ariana West',
      email: 'ariana@barrzen.com',
      type: 'Member',
      roles: 'Realm admin',
      status: 'Active'
    },
    {
      name: 'Northwind Sync',
      email: 'sync@services.local',
      type: 'Service',
      roles: 'Automation',
      status: 'Healthy'
    },
    {
      name: 'Milan Reza',
      email: 'milan@barrzen.com',
      type: 'Member',
      roles: 'Security analyst',
      status: 'Pending action'
    },
    {
      name: 'Customer Portal',
      email: 'portal@services.local',
      type: 'Service',
      roles: 'Confidential client',
      status: 'Active'
    }
  ];
  const requiredActions = ['Configure OTP', 'Verify email', 'Update password'];
  const roleAssignments = [
    { name: 'realm-admin', scope: 'Realm', members: '12 assignees' },
    { name: 'audit-review', scope: 'SeaWatch', members: '4 assignees' },
    { name: 'support-operator', scope: 'Clients', members: '9 assignees' }
  ];
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
      <ChipTabs items={filters} active="All users" tone="soft" />
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
      value="18,426"
      delta="+8.4%"
      meta="realm members and services"
    >
      {#snippet icon()}<Users size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Email verified"
      value="91.2%"
      delta="+2.1%"
      meta="steady verification rate"
      tone="success"
    >
      {#snippet icon()}<Mail size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="MFA enrolled"
      value="84.1%"
      delta="+1.8%"
      meta="configured or recovery ready"
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
          <input type="search" placeholder="Search by name, email, role..." />
        </label>
      {/snippet}

      <div class="users-table">
        {#each users as user (user.email)}
          <div class="users-table__row">
            <div class="users-table__identity">
              <span>{user.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            </div>
            <div>
              <strong>{user.type}</strong>
              <small>{user.roles}</small>
            </div>
            <div class="users-table__status">{user.status}</div>
          </div>
        {/each}
      </div>
    </SectionCard>

    <div class="users-page__stack">
      <SectionCard
        eyebrow="Profile"
        title="Selected identity"
        description="A cleaner detail pane for everyday admin review."
        compact={true}
      >
        <div class="users-page__profile">
          <div>
            <strong>Ariana West</strong>
            <small>Realm admin</small>
          </div>
          <div class="users-page__profile-grid">
            <div><span>Username</span><strong>ariana</strong></div>
            <div><span>Status</span><strong>Enabled</strong></div>
            <div><span>Email verified</span><strong>Yes</strong></div>
            <div><span>Created</span><strong>14 Dec 2025</strong></div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Required actions"
        title="Pending next steps"
        compact={true}
      >
        <div class="users-page__chips">
          {#each requiredActions as action (action)}
            <span>{action}</span>
          {/each}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Role mapping"
        title="Assigned role sets"
        compact={true}
      >
        <div class="users-page__role-list">
          {#each roleAssignments as role (role.name)}
            <div>
              <strong>{role.name}</strong>
              <span>{role.scope}</span>
              <small>{role.members}</small>
            </div>
          {/each}
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
  .users-page__chips {
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

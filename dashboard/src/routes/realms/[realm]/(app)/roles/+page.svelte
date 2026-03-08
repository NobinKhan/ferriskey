<script lang="ts">
  import { BadgeCheck, Shield, Users } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import LinearMeter from '$components/LinearMeter.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  const roleTabs = ['Realm roles', 'Client roles', 'Permission sets'];
  const roles = [
    {
      name: 'realm-admin',
      scope: 'Realm',
      desc: 'Full administrative control',
      assigned: '12 users'
    },
    {
      name: 'audit-review',
      scope: 'SeaWatch',
      desc: 'Read audit events and exports',
      assigned: '4 users'
    },
    {
      name: 'support-operator',
      scope: 'Support',
      desc: 'Manage users and sessions',
      assigned: '9 users'
    },
    {
      name: 'billing-client',
      scope: 'Client',
      desc: 'Scoped to partner-billing',
      assigned: '1 service'
    }
  ];
</script>

<div class="roles-page">
  <section class="roles-page__hero glass-panel">
    <div>
      <p>Roles workspace</p>
      <h2>Permission modeling without the old clutter.</h2>
      <span
        >Move between realm roles, client roles, and permission coverage with
        cleaner segmentation and stronger context.</span
      >
    </div>
    <ChipTabs items={roleTabs} active="Realm roles" tone="soft" />
  </section>

  <section class="roles-page__metrics">
    <MetricCard
      title="Total roles"
      value="148"
      delta="+6"
      meta="realm and client scopes"
    >
      {#snippet icon()}<BadgeCheck size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Assigned users"
      value="312"
      delta="+11%"
      meta="with at least one role"
      tone="success"
    >
      {#snippet icon()}<Users size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Coverage quality"
      value="86%"
      delta="+5%"
      meta="permission sets normalized"
      tone="primary"
    >
      {#snippet icon()}<Shield size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="roles-page__content">
    <SectionCard
      eyebrow="Role directory"
      title="Searchable roles"
      description="Each entry carries scope, intent, and assignee context."
    >
      <div class="roles-page__list">
        {#each roles as role (role.name)}
          <div class="roles-page__row">
            <div>
              <strong>{role.name}</strong>
              <small>{role.desc}</small>
            </div>
            <div>
              <strong>{role.scope}</strong>
              <small>{role.assigned}</small>
            </div>
          </div>
        {/each}
      </div>
    </SectionCard>

    <div class="roles-page__stack">
      <SectionCard eyebrow="Permissions" title="Enabled groups" compact={true}>
        <div class="roles-page__meters">
          <LinearMeter
            label="Identity management"
            value={96}
            meta="create, update, invite"
          />
          <LinearMeter
            label="Security policies"
            value={82}
            meta="MFA and lockout actions"
            tone="var(--success)"
          />
          <LinearMeter
            label="Realm configuration"
            value={68}
            meta="guardrails still narrowing"
            tone="var(--warning)"
          />
        </div>
      </SectionCard>

      <SectionCard eyebrow="Selected role" title="realm-admin" compact={true}>
        <div class="roles-page__detail-grid">
          <div><span>Scope</span><strong>Realm</strong></div>
          <div><span>Permissions</span><strong>47 enabled</strong></div>
          <div><span>Users</span><strong>12 assigned</strong></div>
          <div><span>Clients</span><strong>3 related</strong></div>
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<style>
  .roles-page,
  .roles-page__metrics,
  .roles-page__content,
  .roles-page__stack,
  .roles-page__list,
  .roles-page__meters,
  .roles-page__detail-grid {
    display: grid;
    gap: 24px;
  }

  .roles-page__hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    padding: 24px;
  }

  h2 {
    margin: 8px 0 10px;
    font: 700 clamp(2rem, 4vw, 3.2rem)/0.98 var(--font-display);
    letter-spacing: -0.05em;
  }

  p,
  span,
  small {
    margin: 0;
    color: var(--text-muted);
  }

  .roles-page__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .roles-page__content {
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  }

  .roles-page__row,
  .roles-page__detail-grid div {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .roles-page__row {
    grid-template-columns: minmax(0, 1fr) 160px;
    align-items: center;
  }

  strong {
    color: var(--text);
  }

  .roles-page__detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  @media (max-width: 1000px) {
    .roles-page__metrics,
    .roles-page__content,
    .roles-page__row,
    .roles-page__detail-grid {
      grid-template-columns: 1fr;
    }

    .roles-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

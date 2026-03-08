<script lang="ts">
  import { Database, RefreshCw, Server, ShieldCheck } from 'lucide-svelte';
  import LinearMeter from '$components/LinearMeter.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  const providers = [
    {
      name: 'Corporate LDAP',
      users: '12,340 users',
      status: 'Healthy',
      sync: '4 min ago'
    },
    {
      name: 'Partner Directory',
      users: '1,248 users',
      status: 'Review',
      sync: '31 min ago'
    },
    {
      name: 'Kerberos Realm',
      users: '4,612 users',
      status: 'Healthy',
      sync: '11 min ago'
    }
  ];
</script>

<div class="federation-page">
  <section class="federation-page__hero glass-panel">
    <div>
      <p>User federation</p>
      <h2>External directory operations behave more like an ops center.</h2>
      <span
        >Provider health, sync results, and edit-time actions are grouped so
        admins can configure and operate from the same screen.</span
      >
    </div>
    <div class="federation-page__actions">
      <button type="button">Add provider</button>
      <button type="button" class="federation-page__secondary">Sync all</button>
    </div>
  </section>

  <section class="federation-page__metrics">
    <MetricCard
      title="Active providers"
      value="7"
      delta="+1"
      meta="LDAP, Kerberos, custom"
    >
      {#snippet icon()}<Database size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Connected users"
      value="18,200"
      delta="+4.2%"
      meta="federated identities"
      tone="success"
    >
      {#snippet icon()}<Server size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Sync reliability"
      value="97.8%"
      delta="+0.8%"
      meta="last 30 days"
      tone="primary"
    >
      {#snippet icon()}<RefreshCw size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="federation-page__content">
    <SectionCard
      eyebrow="Providers"
      title="Connected sources"
      description="A higher-signal directory view for status, user count, and latest sync."
    >
      <div class="federation-page__rows">
        {#each providers as provider (provider.name)}
          <div class="federation-page__row">
            <div>
              <strong>{provider.name}</strong>
              <small>{provider.users}</small>
            </div>
            <div>
              <strong>{provider.status}</strong>
              <small>{provider.sync}</small>
            </div>
          </div>
        {/each}
      </div>
    </SectionCard>

    <div class="federation-page__stack">
      <SectionCard eyebrow="LDAP detail" title="Corporate LDAP" compact={true}>
        <div class="federation-page__detail-grid">
          <div>
            <span>Connection</span><strong>ldaps://corp.barrzen.local</strong>
          </div>
          <div><span>Sync interval</span><strong>Every 15 minutes</strong></div>
          <div>
            <span>User search base</span><strong
              >ou=people,dc=barrzen,dc=local</strong
            >
          </div>
          <div><span>Last result</span><strong>Healthy sync</strong></div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Operational actions"
        title="Reliability focus"
        compact={true}
      >
        <div class="federation-page__meters">
          <LinearMeter
            label="Connection tests"
            value={98}
            meta="bind and search stable"
          />
          <LinearMeter
            label="Mapper validation"
            value={87}
            meta="attribute mappings mostly normalized"
            tone="var(--success)"
          />
          <LinearMeter
            label="Sync conflict review"
            value={61}
            meta="still needs cleanup"
            tone="var(--warning)"
          />
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<style>
  .federation-page,
  .federation-page__metrics,
  .federation-page__content,
  .federation-page__stack,
  .federation-page__rows,
  .federation-page__detail-grid,
  .federation-page__meters {
    display: grid;
    gap: 24px;
  }

  .federation-page__hero {
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

  .federation-page__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  button {
    padding: 14px 16px;
    border-radius: 16px;
    border: 0;
    background: var(--primary);
    color: white;
    font-weight: 700;
  }

  .federation-page__secondary {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .federation-page__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .federation-page__content {
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  }

  .federation-page__row,
  .federation-page__detail-grid div {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .federation-page__row {
    grid-template-columns: minmax(0, 1fr) 160px;
    align-items: center;
  }

  .federation-page__detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  strong {
    color: var(--text);
  }

  @media (max-width: 1000px) {
    .federation-page__metrics,
    .federation-page__content,
    .federation-page__row,
    .federation-page__detail-grid {
      grid-template-columns: 1fr;
    }

    .federation-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

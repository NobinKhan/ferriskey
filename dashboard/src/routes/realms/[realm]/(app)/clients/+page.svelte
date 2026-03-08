<script lang="ts">
  import { KeyRound, PanelsTopLeft, Rocket, Shield } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import LinearMeter from '$components/LinearMeter.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';
  import { ripple } from '$utils/ripple';

  const tabs = ['All clients', 'Confidential', 'Public', 'Deprecated'];
  const clients = [
    {
      name: 'Barrzen Portal',
      id: 'barrzen-portal',
      kind: 'Confidential',
      status: 'Active',
      redirects: '12 URIs'
    },
    {
      name: 'Partner Console',
      id: 'partner-console',
      kind: 'Public',
      status: 'Review',
      redirects: '4 URIs'
    },
    {
      name: 'Mobile API',
      id: 'mobile-api',
      kind: 'Bearer-only',
      status: 'Active',
      redirects: 'API only'
    },
    {
      name: 'Legacy Backoffice',
      id: 'legacy-backoffice',
      kind: 'Confidential',
      status: 'Deprecated',
      redirects: '7 URIs'
    }
  ];
</script>

<div class="clients-page">
  <section class="clients-page__hero glass-panel">
    <div>
      <p>Clients workspace</p>
      <h2>Safer application setup with less buried configuration.</h2>
      <span
        >Credential visibility, redirect hygiene, and grant-type review now live
        in a more structured Barrzen Minimal layout.</span
      >
    </div>
    <div class="clients-page__hero-actions">
      <ChipTabs items={tabs} active="All clients" tone="soft" />
      <button type="button" class="clients-page__cta" use:ripple
        >New client</button
      >
    </div>
  </section>

  <section class="clients-page__metrics">
    <MetricCard
      title="Managed clients"
      value="286"
      delta="+12"
      meta="added this month"
    >
      {#snippet icon()}<PanelsTopLeft size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Secret rotation"
      value="93%"
      delta="+6%"
      meta="within 30-day policy"
      tone="success"
    >
      {#snippet icon()}<KeyRound size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Grant hygiene"
      value="88%"
      delta="+3%"
      meta="least-privilege trend"
      tone="primary"
    >
      {#snippet icon()}<Shield size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="clients-page__content">
    <SectionCard
      eyebrow="Inventory"
      title="Registered clients"
      description="Searchable cards for IDs, types, states, and redirect footprint."
    >
      <div class="client-list">
        {#each clients as client (client.id)}
          <div class="client-list__row">
            <div>
              <strong>{client.name}</strong>
              <small>{client.id}</small>
            </div>
            <div>
              <strong>{client.kind}</strong>
              <small>{client.redirects}</small>
            </div>
            <span>{client.status}</span>
          </div>
        {/each}
      </div>
    </SectionCard>

    <div class="clients-page__stack">
      <SectionCard
        eyebrow="Current detail"
        title="Barrzen Portal"
        compact={true}
      >
        <div class="clients-page__detail-grid">
          <div><span>Client type</span><strong>Confidential</strong></div>
          <div><span>Access grants</span><strong>Code, Refresh</strong></div>
          <div><span>Redirect URIs</span><strong>12 managed</strong></div>
          <div>
            <span>Secret status</span><strong>Rotated 4 days ago</strong>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Capability config"
        title="Operational health"
        compact={true}
      >
        <div class="clients-page__meters">
          <LinearMeter
            label="Redirect URI hygiene"
            value={94}
            meta="wildcard usage nearly eliminated"
          />
          <LinearMeter
            label="Secret freshness"
            value={89}
            meta="rotation policy enforced"
            tone="var(--success)"
          />
          <LinearMeter
            label="Grant simplification"
            value={71}
            meta="some legacy flows remain"
            tone="var(--warning)"
          />
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Credential panel"
        title="Current secret state"
        compact={true}
      >
        <div class="clients-page__credential-card">
          <strong>Secret available</strong>
          <small>Last revealed 21 days ago by Barrzen Product team.</small>
          <button type="button" use:ripple>Rotate secret</button>
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<style>
  .clients-page,
  .clients-page__stack,
  .clients-page__metrics,
  .clients-page__content,
  .clients-page__meters,
  .client-list,
  .clients-page__detail-grid {
    display: grid;
    gap: 24px;
  }

  .clients-page__hero {
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

  .clients-page__hero-actions {
    display: grid;
    gap: 12px;
    justify-items: end;
  }

  .clients-page__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .clients-page__content {
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  }

  .clients-page__cta,
  .clients-page__credential-card button {
    padding: 14px 16px;
    border-radius: 16px;
    border: 0;
    background: var(--primary);
    color: white;
    font-weight: 700;
    cursor: pointer;
  }

  .client-list__row,
  .clients-page__detail-grid div,
  .clients-page__credential-card {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .client-list__row {
    grid-template-columns: minmax(0, 1fr) minmax(160px, 0.7fr) auto;
    align-items: center;
    gap: 16px;
  }

  .client-list__row span {
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: 0.82rem;
    font-weight: 700;
  }

  strong {
    color: var(--text);
  }

  .clients-page__detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .clients-page__credential-card button {
    justify-self: start;
    margin-top: 8px;
  }

  @media (max-width: 1000px) {
    .clients-page__metrics,
    .clients-page__content,
    .client-list__row,
    .clients-page__detail-grid {
      grid-template-columns: 1fr;
    }

    .clients-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .clients-page__hero-actions {
      justify-items: start;
    }
  }
</style>

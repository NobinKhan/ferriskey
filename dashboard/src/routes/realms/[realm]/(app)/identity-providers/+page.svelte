<script lang="ts">
  import { Globe, LockKeyhole, Network, ScanSearch } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  const providers = [
    {
      name: 'Google Workspace',
      kind: 'Social',
      alias: 'google',
      status: 'Connected'
    },
    {
      name: 'Azure AD',
      kind: 'Enterprise',
      alias: 'azure-ad',
      status: 'Healthy'
    },
    { name: 'GitHub', kind: 'Developer', alias: 'github', status: 'Review' }
  ];
</script>

<div class="idp-page">
  <section class="idp-page__hero glass-panel">
    <div>
      <p>Identity providers</p>
      <h2>Provider setup feels closer to a guided product flow.</h2>
      <span
        >Group provider types, surface alias and status clearly, and keep
        configuration help near the main action.</span
      >
    </div>
    <ChipTabs
      items={['Gallery', 'Configured', 'Review']}
      active="Configured"
      tone="soft"
    />
  </section>

  <section class="idp-page__metrics">
    <MetricCard
      title="Connected providers"
      value="12"
      delta="+2"
      meta="enabled in this realm"
    >
      {#snippet icon()}<Network size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Healthy mappings"
      value="91%"
      delta="+4%"
      meta="claim and alias validation"
      tone="success"
    >
      {#snippet icon()}<ScanSearch size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Enterprise coverage"
      value="67%"
      delta="+5%"
      meta="SAML and OIDC rollout"
      tone="primary"
    >
      {#snippet icon()}<LockKeyhole size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="idp-page__content">
    <SectionCard
      eyebrow="Configured"
      title="Provider directory"
      description="Alias, category, and status become the primary scannable fields."
    >
      <div class="idp-page__rows">
        {#each providers as provider (provider.alias)}
          <div class="idp-page__row">
            <div>
              <strong>{provider.name}</strong>
              <small>{provider.alias}</small>
            </div>
            <div>
              <strong>{provider.kind}</strong>
              <small>{provider.status}</small>
            </div>
          </div>
        {/each}
      </div>
    </SectionCard>

    <div class="idp-page__stack">
      <SectionCard eyebrow="Wizard" title="Creation flow" compact={true}>
        <div class="idp-page__steps">
          <span>1. Choose provider</span>
          <span>2. Configure details</span>
          <span>3. Review and enable</span>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Help panel"
        title="Recommended guidance"
        compact={true}
      >
        <div class="idp-page__help">
          <div>
            <Globe size={18} color="var(--primary)" /><strong
              >Domain hints</strong
            ><small>Show issuer and callback patterns inline.</small>
          </div>
          <div>
            <LockKeyhole size={18} color="var(--primary)" /><strong
              >Secrets handling</strong
            ><small>Keep sensitive values masked until explicit reveal.</small>
          </div>
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<style>
  .idp-page,
  .idp-page__metrics,
  .idp-page__content,
  .idp-page__stack,
  .idp-page__rows,
  .idp-page__steps,
  .idp-page__help {
    display: grid;
    gap: 24px;
  }

  .idp-page__hero {
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

  .idp-page__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .idp-page__content {
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  }

  .idp-page__row,
  .idp-page__help div {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .idp-page__row {
    grid-template-columns: minmax(0, 1fr) 140px;
    align-items: center;
  }

  .idp-page__steps span {
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 700;
  }

  .idp-page__help div {
    gap: 8px;
  }

  strong {
    color: var(--text);
  }

  @media (max-width: 1000px) {
    .idp-page__metrics,
    .idp-page__content,
    .idp-page__row {
      grid-template-columns: 1fr;
    }

    .idp-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

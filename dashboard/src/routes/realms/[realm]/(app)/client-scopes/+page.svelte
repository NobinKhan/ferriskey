<script lang="ts">
  import { KeyRound, Layers3, Puzzle, SlidersHorizontal } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  const tabs = ['Shared scopes', 'Assigned scopes', 'Protocol mappers'];
  const scopes = [
    {
      name: 'profile',
      type: 'Default',
      protocol: 'openid-connect',
      mappers: 4
    },
    { name: 'roles', type: 'Optional', protocol: 'openid-connect', mappers: 7 },
    {
      name: 'tenant-context',
      type: 'Custom',
      protocol: 'openid-connect',
      mappers: 3
    },
    {
      name: 'analytics',
      type: 'Optional',
      protocol: 'openid-connect',
      mappers: 2
    }
  ];
</script>

<div class="scopes-page">
  <section class="scopes-page__hero glass-panel">
    <div>
      <p>Client scopes</p>
      <h2>Claims, mappers, and scope assignment with less friction.</h2>
      <span
        >The new layout keeps shared scopes, mapper density, and per-client
        assignment readable at a glance.</span
      >
    </div>
    <ChipTabs items={tabs} active="Shared scopes" tone="soft" />
  </section>

  <section class="scopes-page__metrics">
    <MetricCard
      title="Shared scopes"
      value="32"
      delta="+3"
      meta="active across realm"
    >
      {#snippet icon()}<Layers3 size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Protocol mappers"
      value="118"
      delta="+9"
      meta="named and documented"
      tone="success"
    >
      {#snippet icon()}<Puzzle size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Effective claims"
      value="84%"
      delta="+5%"
      meta="standardized output"
      tone="primary"
    >
      {#snippet icon()}<KeyRound size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="scopes-page__content">
    <SectionCard
      eyebrow="Scope registry"
      title="Reusable scopes"
      description="Documented shared scopes with protocol context and mapper count."
    >
      <div class="scopes-page__rows">
        {#each scopes as scope (scope.name)}
          <div class="scopes-page__row">
            <div>
              <strong>{scope.name}</strong>
              <small>{scope.protocol}</small>
            </div>
            <div>
              <strong>{scope.type}</strong>
              <small>{scope.mappers} mappers</small>
            </div>
          </div>
        {/each}
      </div>
    </SectionCard>

    <div class="scopes-page__stack">
      <SectionCard
        eyebrow="Protocol mappers"
        title="Mapper presets"
        compact={true}
      >
        <div class="scopes-page__chips">
          <span>Realm roles</span>
          <span>Client roles</span>
          <span>Tenant id</span>
          <span>Session index</span>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Assignment"
        title="Current client usage"
        compact={true}
      >
        <div class="scopes-page__assignment">
          <div>
            <span>Default scopes</span><strong>profile, roles, email</strong>
          </div>
          <div>
            <span>Optional scopes</span><strong
              >analytics, tenant-context</strong
            >
          </div>
          <div>
            <span>Review signal</span><strong
              >2 scopes need mapper cleanup</strong
            >
          </div>
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<style>
  .scopes-page,
  .scopes-page__metrics,
  .scopes-page__content,
  .scopes-page__stack,
  .scopes-page__rows,
  .scopes-page__chips,
  .scopes-page__assignment {
    display: grid;
    gap: 24px;
  }

  .scopes-page__hero {
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

  .scopes-page__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .scopes-page__content {
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  }

  .scopes-page__row,
  .scopes-page__assignment div {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .scopes-page__row {
    grid-template-columns: minmax(0, 1fr) 160px;
    align-items: center;
  }

  .scopes-page__chips {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .scopes-page__chips span {
    padding: 12px 14px;
    border-radius: 16px;
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 700;
  }

  strong {
    color: var(--text);
  }

  @media (max-width: 1000px) {
    .scopes-page__metrics,
    .scopes-page__content,
    .scopes-page__row,
    .scopes-page__chips {
      grid-template-columns: 1fr;
    }

    .scopes-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

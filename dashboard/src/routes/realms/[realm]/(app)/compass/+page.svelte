<script lang="ts">
  import {
    Compass as CompassIcon,
    Route,
    Timer,
    Workflow
  } from 'lucide-svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  const flows = [
    {
      name: 'Browser login',
      status: 'Stable',
      duration: '642ms',
      client: 'barrzen-portal'
    },
    {
      name: 'Token refresh',
      status: 'Fast',
      duration: '188ms',
      client: 'mobile-api'
    },
    {
      name: 'Brokered SSO',
      status: 'Review',
      duration: '1.4s',
      client: 'azure-ad'
    }
  ];
  const steps = [
    {
      title: 'Credential capture',
      meta: 'Username and password accepted',
      tone: 'var(--primary)'
    },
    {
      title: 'Password validation',
      meta: 'Hash verified against realm policy',
      tone: 'var(--success)'
    },
    {
      title: 'TOTP challenge',
      meta: 'Secondary factor completed',
      tone: 'var(--success)'
    },
    {
      title: 'Token issuance',
      meta: 'Access and refresh tokens minted',
      tone: 'var(--primary)'
    }
  ];
</script>

<div class="compass-page">
  <section class="compass-page__hero glass-panel">
    <div>
      <p>Compass</p>
      <h2>Authentication flow analysis becomes visual and readable.</h2>
      <span
        >Browse active flows and inspect a simplified step graph without
        dropping into a dense debugger-like screen.</span
      >
    </div>
  </section>

  <section class="compass-page__metrics">
    <MetricCard
      title="Tracked flows"
      value="81"
      delta="+7"
      meta="active flow sessions"
    >
      {#snippet icon()}<CompassIcon size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Median duration"
      value="642ms"
      delta="-54ms"
      meta="end-to-end login path"
      tone="success"
    >
      {#snippet icon()}<Timer size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Flow health"
      value="89%"
      delta="+4%"
      meta="error-free execution"
      tone="primary"
    >
      {#snippet icon()}<Workflow size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="compass-page__content">
    <SectionCard
      eyebrow="Flow list"
      title="Recent authentication flows"
      description="List and compare grant timing, client, and health in a more visual summary."
    >
      <div class="compass-page__flows">
        {#each flows as flow (flow.name)}
          <div class="compass-page__flow-row">
            <div>
              <strong>{flow.name}</strong>
              <small>{flow.client}</small>
            </div>
            <div>
              <strong>{flow.status}</strong>
              <small>{flow.duration}</small>
            </div>
          </div>
        {/each}
      </div>
    </SectionCard>

    <SectionCard
      eyebrow="Flow detail"
      title="Browser login graph"
      description="A Minimal-style visual timeline preview for the selected flow."
      compact={true}
    >
      <div class="compass-page__graph">
        {#each steps as step, index (step.title)}
          <div class="compass-page__graph-step">
            <span class="compass-page__node" style={`color:${step.tone}`}
            ></span>
            <div>
              <strong>{step.title}</strong>
              <small>{step.meta}</small>
            </div>
          </div>
          {#if index < steps.length - 1}
            <div class="compass-page__graph-line"><Route size={16} /></div>
          {/if}
        {/each}
      </div>
    </SectionCard>
  </section>
</div>

<style>
  .compass-page,
  .compass-page__metrics,
  .compass-page__content,
  .compass-page__flows,
  .compass-page__graph {
    display: grid;
    gap: 24px;
  }

  .compass-page__hero {
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

  .compass-page__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .compass-page__content {
    grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
  }

  .compass-page__flow-row,
  .compass-page__graph-step {
    display: grid;
    gap: 4px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .compass-page__flow-row {
    grid-template-columns: minmax(0, 1fr) 140px;
    align-items: center;
  }

  .compass-page__graph-step {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 14px;
  }

  .compass-page__node {
    display: inline-flex;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 10px color-mix(in srgb, currentColor 14%, transparent);
  }

  .compass-page__graph-line {
    display: grid;
    justify-content: center;
    color: var(--text-muted);
  }

  strong {
    color: var(--text);
  }

  @media (max-width: 1000px) {
    .compass-page__metrics,
    .compass-page__content,
    .compass-page__flow-row {
      grid-template-columns: 1fr;
    }
  }
</style>

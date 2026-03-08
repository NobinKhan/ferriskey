<script lang="ts">
  import { AlertTriangle, ShieldCheck, Siren, TimerReset } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import MetricCard from '$components/MetricCard.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  const feedTabs = ['All', 'Success', 'Failure'];
  const events = [
    {
      title: 'Password spray blocked',
      meta: '92 attempts from 103.22.8.15',
      time: '2 min ago',
      tone: 'var(--danger)'
    },
    {
      title: 'Admin sign-in completed',
      meta: 'Ariana West via password + OTP',
      time: '6 min ago',
      tone: 'var(--success)'
    },
    {
      title: 'Client secret rotation created',
      meta: 'Barrzen Portal confidential secret renewed',
      time: '13 min ago',
      tone: 'var(--primary)'
    },
    {
      title: 'LDAP sync warning',
      meta: 'Partner directory response slowed beyond threshold',
      time: '31 min ago',
      tone: 'var(--warning)'
    }
  ];
</script>

<div class="seawatch-page">
  <section class="seawatch-page__hero glass-panel">
    <div>
      <p>SeaWatch</p>
      <h2>Security monitoring moves into a calmer operations rail.</h2>
      <span
        >Keep the live feed readable while preserving the event context needed
        for decisions and escalation.</span
      >
    </div>
    <ChipTabs items={feedTabs} active="All" tone="soft" />
  </section>

  <section class="seawatch-page__metrics">
    <MetricCard
      title="Live events"
      value="2,481"
      delta="+18%"
      meta="last 24 hours"
    >
      {#snippet icon()}<Siren size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Successful auth"
      value="92.7%"
      delta="+1.6%"
      meta="healthy login completion"
      tone="success"
    >
      {#snippet icon()}<ShieldCheck size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Risk alerts"
      value="14"
      delta="-3"
      meta="high-priority anomalies"
      tone="warning"
    >
      {#snippet icon()}<AlertTriangle size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
    <MetricCard
      title="Response time"
      value="4m 18s"
      delta="-22s"
      meta="triage median"
      tone="primary"
    >
      {#snippet icon()}<TimerReset size={24} strokeWidth={2.2} />{/snippet}
    </MetricCard>
  </section>

  <section class="seawatch-page__content">
    <SectionCard
      eyebrow="Live feed"
      title="Event timeline"
      description="Timeline cards designed for faster scanning and less visual overload."
    >
      <div class="seawatch-page__timeline">
        {#each events as event (event.title)}
          <section>
            <span class="status-dot" style={`color:${event.tone}`}></span>
            <div>
              <strong>{event.title}</strong>
              <p>{event.meta}</p>
            </div>
            <small>{event.time}</small>
          </section>
        {/each}
      </div>
    </SectionCard>

    <div class="seawatch-page__stack">
      <SectionCard
        eyebrow="Event breakdown"
        title="Current risk mix"
        compact={true}
      >
        <div class="seawatch-page__bars">
          <div>
            <span style="width: 72%; background: var(--success)"></span><strong
              >Success</strong
            ><small>72%</small>
          </div>
          <div>
            <span style="width: 18%; background: var(--warning)"></span><strong
              >Warning</strong
            ><small>18%</small>
          </div>
          <div>
            <span style="width: 10%; background: var(--danger)"></span><strong
              >Failure</strong
            ><small>10%</small>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Risky actors"
        title="Entities to review"
        compact={true}
      >
        <div class="seawatch-page__actors">
          <div>
            <strong>103.22.8.15</strong><small>Repeated spray attempts</small>
          </div>
          <div>
            <strong>legacy-backoffice</strong><small>Token refresh bursts</small
            >
          </div>
          <div>
            <strong>partner-admin</strong><small>Failed OTP on new device</small
            >
          </div>
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<style>
  .seawatch-page,
  .seawatch-page__metrics,
  .seawatch-page__content,
  .seawatch-page__stack,
  .seawatch-page__timeline,
  .seawatch-page__bars,
  .seawatch-page__actors {
    display: grid;
    gap: 24px;
  }

  .seawatch-page__hero {
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

  .seawatch-page__metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .seawatch-page__content {
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  }

  .seawatch-page__timeline section,
  .seawatch-page__actors div,
  .seawatch-page__bars div {
    display: grid;
    gap: 8px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .seawatch-page__timeline section {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
  }

  .seawatch-page__bars div {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .seawatch-page__bars span {
    display: block;
    height: 10px;
    border-radius: 999px;
  }

  strong {
    color: var(--text);
  }

  @media (max-width: 1000px) {
    .seawatch-page__metrics,
    .seawatch-page__content,
    .seawatch-page__timeline section,
    .seawatch-page__bars div {
      grid-template-columns: 1fr;
    }

    .seawatch-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

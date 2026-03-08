<script lang="ts">
  import { BellRing, Globe, ShieldCheck, Webhook } from 'lucide-svelte';
  import ChipTabs from '$components/ChipTabs.svelte';
  import SectionCard from '$components/SectionCard.svelte';

  const tabs = ['General', 'Login', 'Webhooks', 'Security'];
  const webhookEvents = [
    'user.created',
    'client.updated',
    'login.failed',
    'realm.deleted'
  ];
</script>

<div class="realm-page">
  <section class="realm-page__hero glass-panel">
    <div>
      <p>Realm settings</p>
      <h2>Configuration grouped into calmer, safer decision areas.</h2>
      <span
        >General metadata, login behavior, and outbound webhook controls now sit
        in clearer operational sections.</span
      >
    </div>
    <ChipTabs items={tabs} active="General" tone="soft" />
  </section>

  <section class="realm-page__content">
    <SectionCard
      eyebrow="General"
      title="Realm identity"
      description="Foundational settings kept visible without pushing operators into long forms."
    >
      <div class="realm-page__grid">
        <div>
          <Globe size={18} color="var(--primary)" /><strong>Name</strong><small
            >master</small
          >
        </div>
        <div>
          <ShieldCheck size={18} color="var(--primary)" /><strong
            >Signing algorithm</strong
          ><small>RS256</small>
        </div>
        <div>
          <BellRing size={18} color="var(--primary)" /><strong
            >Remember me</strong
          ><small>Enabled</small>
        </div>
        <div>
          <Webhook size={18} color="var(--primary)" /><strong>Webhooks</strong
          ><small>3 active endpoints</small>
        </div>
      </div>
    </SectionCard>

    <div class="realm-page__stack">
      <SectionCard eyebrow="Login" title="Access posture" compact={true}>
        <div class="realm-page__list">
          <div><span>Self registration</span><strong>Enabled</strong></div>
          <div><span>Forgot password</span><strong>Enabled</strong></div>
          <div><span>Remember me</span><strong>Enabled</strong></div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Webhooks" title="Outbound events" compact={true}>
        <div class="realm-page__chips">
          {#each webhookEvents as event (event)}
            <span>{event}</span>
          {/each}
        </div>
      </SectionCard>
    </div>
  </section>
</div>

<style>
  .realm-page,
  .realm-page__content,
  .realm-page__stack,
  .realm-page__grid,
  .realm-page__list,
  .realm-page__chips {
    display: grid;
    gap: 24px;
  }

  .realm-page__hero {
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

  .realm-page__content {
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  }

  .realm-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .realm-page__grid div,
  .realm-page__list div {
    display: grid;
    gap: 6px;
    padding: 16px;
    border-radius: 18px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .realm-page__chips {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .realm-page__chips span {
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
    .realm-page__content,
    .realm-page__grid,
    .realm-page__chips {
      grid-template-columns: 1fr;
    }

    .realm-page__hero {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

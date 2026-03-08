<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    eyebrow,
    title,
    description = '',
    actions,
    children,
    compact = false
  }: {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: Snippet;
    children: Snippet;
    compact?: boolean;
  } = $props();
</script>

<section class:section-card--compact={compact} class="section-card glass-panel">
  <header class="section-card__header">
    <div>
      {#if eyebrow}
        <p class="section-card__eyebrow">{eyebrow}</p>
      {/if}
      <h2>{title}</h2>
      {#if description}
        <span>{description}</span>
      {/if}
    </div>
    {#if actions}
      <div class="section-card__actions">{@render actions()}</div>
    {/if}
  </header>

  <div class="section-card__body">
    {@render children()}
  </div>
</section>

<style>
  .section-card {
    padding: 24px;
  }

  .section-card--compact {
    padding: 20px;
  }

  .section-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .section-card__eyebrow,
  span {
    margin: 0;
    color: var(--text-muted);
  }

  .section-card__eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  h2 {
    margin: 6px 0 4px;
    font: 700 1.3rem/1.1 var(--font-display);
    letter-spacing: -0.04em;
  }

  span {
    display: block;
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .section-card__actions {
    display: inline-flex;
    gap: 10px;
    flex-wrap: wrap;
  }
</style>

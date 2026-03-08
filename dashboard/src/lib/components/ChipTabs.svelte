<script lang="ts">
  let {
    items,
    active,
    tone = 'default'
  }: {
    items: string[];
    active: string;
    tone?: 'default' | 'soft';
  } = $props();
</script>

<div
  class:chip-tabs--soft={tone === 'soft'}
  class="chip-tabs"
  role="tablist"
  aria-label="Page tabs"
>
  {#each items as item (item)}
    <div
      class:chip-tabs__item--active={active === item}
      class="chip-tabs__item"
      role="tab"
      aria-selected={active === item}
    >
      {item}
    </div>
  {/each}
</div>

<style>
  .chip-tabs {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 6px;
    border-radius: 999px;
    background: var(--bg-inset);
    border: 1px solid var(--border);
  }

  .chip-tabs--soft {
    background: transparent;
    border: 0;
    padding: 0;
  }

  .chip-tabs__item {
    padding: 10px 14px;
    border-radius: 999px;
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--text-muted);
    background: transparent;
  }

  .chip-tabs__item--active {
    background: var(--surface);
    box-shadow: var(--shadow-md);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .chip-tabs--soft .chip-tabs__item {
    background: var(--bg-inset);
    border: 1px solid transparent;
  }

  .chip-tabs--soft .chip-tabs__item--active {
    background: var(--primary-soft);
    color: var(--primary);
    box-shadow: none;
    border-color: transparent;
  }
</style>

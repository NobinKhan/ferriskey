<script lang="ts">
  let {
    label,
    value,
    meta = '',
    tone = 'var(--primary)'
  }: {
    label: string;
    value: number;
    meta?: string;
    tone?: string;
  } = $props();
</script>

<div class="linear-meter">
  <div class="linear-meter__copy">
    <strong>{label}</strong>
    <small>{value}%</small>
  </div>
  <div class="linear-meter__track">
    <span style={`width:${value}%; background:${tone}`}></span>
  </div>
  {#if meta}
    <p>{meta}</p>
  {/if}
</div>

<style>
  .linear-meter {
    display: grid;
    gap: 8px;
  }

  .linear-meter__copy {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  strong {
    font-size: 0.92rem;
  }

  small,
  p {
    margin: 0;
    color: var(--text-muted);
  }

  .linear-meter__track {
    height: 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-muted) 16%, transparent);
    overflow: hidden;
  }

  .linear-meter__track span {
    display: block;
    height: 100%;
    border-radius: inherit;
  }

  p {
    font-size: 0.82rem;
  }
</style>

<script lang="ts">
  import { X } from 'lucide-svelte';
  import { ripple } from '$utils/ripple';

  let {
    open = $bindable(false),
    title,
    children,
    onclose
  }: {
    open: boolean;
    title: string;
    children: import('svelte').Snippet;
    onclose?: () => void;
  } = $props();

  function close() {
    open = false;
    onclose?.();
  }

  function handleBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-backdrop" onclick={handleBackdrop} onkeydown={handleKeydown} tabindex="-1">
    <div class="dialog glass-panel" role="dialog" aria-modal="true" aria-label={title}>
      <header class="dialog__header">
        <strong>{title}</strong>
        <button type="button" class="dialog__close" onclick={close} use:ripple aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <div class="dialog__body">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(22, 28, 36, 0.54);
    animation: fade-in 160ms ease;
  }

  .dialog {
    width: min(520px, 100%);
    max-height: calc(100vh - 48px);
    display: grid;
    gap: 0;
    overflow: auto;
    animation: slide-up 200ms ease;
  }

  .dialog__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }

  .dialog__header strong {
    font: 700 1.15rem/1.1 var(--font-display);
  }

  .dialog__close {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
  }

  .dialog__body {
    padding: 24px;
  }

  @keyframes fade-in {
    from { opacity: 0; }
  }

  @keyframes slide-up {
    from { transform: translateY(12px); opacity: 0; }
  }
</style>

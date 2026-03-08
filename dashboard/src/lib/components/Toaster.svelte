<script lang="ts">
  import { CheckCircle, AlertTriangle, X, Info } from 'lucide-svelte';
  import { toasts, dismiss } from '$lib/stores/toast';
</script>

{#if $toasts.length > 0}
  <div class="toast-tray" aria-live="polite">
    {#each $toasts as toast (toast.id)}
      <output class="toast toast--{toast.type}">
        {#if toast.type === 'success'}
          <CheckCircle size={18} />
        {:else if toast.type === 'error'}
          <AlertTriangle size={18} />
        {:else}
          <Info size={18} />
        {/if}
        <span>{toast.message}</span>
        <button type="button" onclick={() => dismiss(toast.id)} aria-label="Dismiss">
          <X size={14} />
        </button>
      </output>
    {/each}
  </div>
{/if}

<style>
  .toast-tray {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 100;
    display: grid;
    gap: 10px;
    max-width: 380px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    animation: slide-in 200ms ease;
    color: var(--text);
  }

  .toast--success { border-color: var(--success); }
  .toast--error   { border-color: var(--danger); }
  .toast--info    { border-color: var(--primary); }

  .toast span { flex: 1; font-size: 0.92rem; }

  .toast button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }

  @keyframes slide-in {
    from { transform: translateX(20px); opacity: 0; }
  }
</style>

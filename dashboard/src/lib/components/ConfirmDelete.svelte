<script lang="ts">
  import { AlertTriangle } from 'lucide-svelte';
  import Dialog from '$components/Dialog.svelte';
  import { ripple } from '$utils/ripple';

  let {
    open = $bindable(false),
    title = 'Confirm deletion',
    message,
    confirming = false,
    onconfirm
  }: {
    open: boolean;
    title?: string;
    message: string;
    confirming?: boolean;
    onconfirm: () => void;
  } = $props();
</script>

<Dialog bind:open {title}>
  <div class="confirm-delete">
    <div class="confirm-delete__icon">
      <AlertTriangle size={28} />
    </div>
    <p>{message}</p>
    <div class="confirm-delete__actions">
      <button
        type="button"
        class="confirm-delete__cancel"
        onclick={() => (open = false)}
        use:ripple
        disabled={confirming}
      >
        Cancel
      </button>
      <button
        type="button"
        class="confirm-delete__danger"
        onclick={onconfirm}
        use:ripple
        disabled={confirming}
      >
        {confirming ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </div>
</Dialog>

<style>
  .confirm-delete {
    display: grid;
    gap: 18px;
    text-align: center;
  }

  .confirm-delete__icon {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    margin: 0 auto;
    border-radius: 50%;
    background: color-mix(in srgb, var(--danger) 12%, transparent);
    color: var(--danger);
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.7;
  }

  .confirm-delete__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .confirm-delete__cancel,
  .confirm-delete__danger {
    padding: 12px 20px;
    border-radius: 14px;
    border: 0;
    font-weight: 700;
    cursor: pointer;
  }

  .confirm-delete__cancel {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
  }

  .confirm-delete__danger {
    background: var(--danger);
    color: white;
  }

  .confirm-delete__danger:disabled,
  .confirm-delete__cancel:disabled {
    opacity: 0.6;
    cursor: wait;
  }
</style>

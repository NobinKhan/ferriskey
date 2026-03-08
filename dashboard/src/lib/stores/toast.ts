/* ────────────────────────────────────────────────────────────
 *  Toast store – exposes showToast() for imperative use.
 *  The companion Toaster.svelte subscribes to the store and
 *  renders the notification tray.
 * ──────────────────────────────────────────────────────────── */

import { writable } from 'svelte/store';

export type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

let nextId = 0;

export const toasts = writable<Toast[]>([]);

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = nextId++;
  toasts.update((list) => [...list, { id, message, type }]);
  setTimeout(() => dismiss(id), 4000);
}

export function dismiss(id: number) {
  toasts.update((list) => list.filter((t) => t.id !== id));
}

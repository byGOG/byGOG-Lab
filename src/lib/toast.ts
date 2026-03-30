/**
 * Simple toast notification utility
 */

let toastEl: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function ensureToast(): HTMLDivElement {
  if (toastEl) return toastEl;
  toastEl = document.createElement('div');
  toastEl.className = 'toast-notification';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  return toastEl;
}

export function showToast(message: string, duration = 2500): void {
  const el = ensureToast();
  el.textContent = message;
  el.classList.add('show');
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.classList.remove('show');
    hideTimer = null;
  }, duration);
}

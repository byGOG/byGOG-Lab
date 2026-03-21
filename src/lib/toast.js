/**
 * Simple toast notification utility
 */

let toastEl = null;
let hideTimer = null;

function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.createElement('div');
  toastEl.className = 'toast-notification';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  return toastEl;
}

/**
 * Show a toast message
 * @param {string} message
 * @param {number} [duration=2500]
 */
export function showToast(message, duration = 2500) {
  const el = ensureToast();
  el.textContent = message;
  el.classList.add('show');
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.classList.remove('show');
    hideTimer = null;
  }, duration);
}

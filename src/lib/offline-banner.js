/**
 * Offline detection banner
 * Shows a banner when the user goes offline
 */
import { t } from './i18n.js';

let bannerEl = null;

function ensureBanner() {
  if (bannerEl) return bannerEl;
  bannerEl = document.createElement('div');
  bannerEl.className = 'offline-banner';
  bannerEl.setAttribute('role', 'alert');
  bannerEl.textContent = t('offline.message');
  document.body.prepend(bannerEl);
  return bannerEl;
}

export function initOfflineBanner() {
  const update = () => {
    const banner = ensureBanner();
    banner.classList.toggle('show', !navigator.onLine);
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  // Check initial state
  if (!navigator.onLine) update();
}

/**
 * Web Share API — delegated share button handler.
 * Adds a share button to each link card via delegation.
 */
import { t } from './i18n.js';

const SHARE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

/**
 * Initialize share buttons on all link cards.
 */
export function initWebShare(container: HTMLElement): void {
  if (!container) return;
  if (!navigator.share && !navigator.clipboard) return;

  // Add share buttons to existing and future cards via MutationObserver
  function addShareButtons(root: HTMLElement): void {
    root.querySelectorAll('.category-card li').forEach(li => {
      if (li.querySelector('.share-btn')) return;
      const a = li.querySelector('a[href]');
      if (!a) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'share-btn';
      btn.setAttribute('aria-label', t('share.label'));
      btn.title = t('share.label');
      btn.innerHTML = SHARE_ICON;
      a.appendChild(btn);
    });
  }

  addShareButtons(container);

  // Watch for lazy-loaded categories
  try {
    const mo = new MutationObserver(() => addShareButtons(container));
    mo.observe(container, { childList: true, subtree: true });
  } catch {}

  // Delegated click handler
  container.addEventListener('click', async ev => {
    const btn = (ev.target as HTMLElement).closest('.share-btn') as HTMLElement | null;
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();

    const li = btn.closest('li') as HTMLElement | null;
    const a = li?.querySelector('a[href]') as HTMLAnchorElement | null;
    if (!a) return;

    const name = (li as HTMLElement).dataset.nameOriginal || a.textContent!.trim();
    const url = a.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await navigator.clipboard.writeText(url);
        btn.classList.add('share-copied');
        setTimeout(() => btn.classList.remove('share-copied'), 1500);
      }
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        // Fallback: copy URL
        try {
          await navigator.clipboard.writeText(url);
          btn.classList.add('share-copied');
          setTimeout(() => btn.classList.remove('share-copied'), 1500);
        } catch {}
      }
    }
  });
}

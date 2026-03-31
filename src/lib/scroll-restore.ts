/**
 * Scroll position restore.
 * Saves scroll position to sessionStorage so the user returns
 * to where they left off after refresh or back navigation.
 */

const KEY = 'bygog_scrollY';

let _restoring = false;
try {
  const _saved = sessionStorage.getItem(KEY);
  if (_saved && parseInt(_saved, 10) > 0) _restoring = true;
} catch { /* sessionStorage erişilemez */ }

export function isScrollRestoring(): boolean {
  return _restoring;
}

export function initScrollRestore(): void {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      if (y > 0) {
        const restore = () => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });

        requestAnimationFrame(() => {
          setTimeout(restore, 80);
        });

        const container = document.getElementById('links-container');
        if (container) {
          let restoreTimer: ReturnType<typeof setTimeout> | null = null;
          const mo = new MutationObserver(() => {
            if (restoreTimer) clearTimeout(restoreTimer);
            restoreTimer = setTimeout(restore, 50);
          });
          mo.observe(container, { childList: true, subtree: true });
          setTimeout(() => {
            mo.disconnect();
            if (restoreTimer) clearTimeout(restoreTimer);
            _restoring = false;
          }, 5000);
        }
      }
      sessionStorage.removeItem(KEY);
    }
  } catch { /* sessionStorage erişilemez */ }

  window.addEventListener('beforeunload', () => {
    try {
      sessionStorage.setItem(KEY, String(window.scrollY));
    } catch { /* sessionStorage erişilemez */ }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      try {
        sessionStorage.setItem(KEY, String(window.scrollY));
      } catch { /* sessionStorage erişilemez */ }
    }
  });
}

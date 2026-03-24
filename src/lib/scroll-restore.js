/**
 * Scroll position restore.
 * Saves scroll position to sessionStorage so the user returns
 * to where they left off after refresh or back navigation.
 */

const KEY = 'bygog_scrollY';

// Module-level flag: true when a saved scroll position exists at load time.
// Checked synchronously by other modules (e.g. category-nav) to skip hash scroll.
let _restoring = false;
try {
  const _saved = sessionStorage.getItem(KEY);
  if (_saved && parseInt(_saved, 10) > 0) _restoring = true;
} catch {}

export function isScrollRestoring() {
  return _restoring;
}

export function initScrollRestore() {
  // Restore saved position
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      if (y > 0) {
        // Try restoring immediately, then re-check as lazy content loads
        const restore = () => window.scrollTo({ top: y, behavior: 'instant' });

        // Initial restore after first paint
        requestAnimationFrame(() => {
          setTimeout(restore, 80);
        });

        // Re-restore as layout shifts from lazy-loaded categories
        // Use a MutationObserver to detect when content is added
        const container = document.getElementById('links-container');
        if (container) {
          let restoreTimer = null;
          const mo = new MutationObserver(() => {
            clearTimeout(restoreTimer);
            restoreTimer = setTimeout(restore, 50);
          });
          mo.observe(container, { childList: true, subtree: true });
          // Stop observing after 5s (all categories should be loaded by then)
          setTimeout(() => {
            mo.disconnect();
            clearTimeout(restoreTimer);
            _restoring = false;
          }, 5000);
        }
      }
      sessionStorage.removeItem(KEY);
    }
  } catch {}

  // Save position before unload
  window.addEventListener('beforeunload', () => {
    try {
      sessionStorage.setItem(KEY, String(window.scrollY));
    } catch {}
  });

  // Also save on visibility change (mobile tab switches)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      try {
        sessionStorage.setItem(KEY, String(window.scrollY));
      } catch {}
    }
  });
}

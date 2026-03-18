/**
 * Scroll position restore.
 * Saves scroll position to sessionStorage so the user returns
 * to where they left off after clicking a link and pressing back.
 */

const KEY = 'bygog_scrollY';

export function initScrollRestore() {
  // Restore saved position
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      if (y > 0) {
        // Wait for lazy-loaded content to settle
        requestAnimationFrame(() => {
          setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' }), 120);
        });
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

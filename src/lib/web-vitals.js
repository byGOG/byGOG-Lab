// @ts-check
/**
 * Web Vitals monitoring (privacy-first — console only, no external reporting)
 * Tracks LCP, CLS, INP for performance awareness
 */

/**
 * Observe Largest Contentful Paint
 */
function observeLCP() {
  if (!('PerformanceObserver' in window)) return;
  try {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        console.debug('[Web Vitals] LCP:', Math.round(/** @type {any} */ (last).startTime), 'ms');
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS() {
  if (!('PerformanceObserver' in window)) return;
  let clsValue = 0;
  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(/** @type {any} */ (entry).hadRecentInput)) {
          clsValue += /** @type {any} */ (entry).value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });

    // Report on page hide
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') {
          console.debug('[Web Vitals] CLS:', clsValue.toFixed(4));
        }
      },
      { once: true }
    );
  } catch {}
}

/**
 * Observe Interaction to Next Paint
 */
function observeINP() {
  if (!('PerformanceObserver' in window)) return;
  /** @type {number[]} */
  const interactions = [];
  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        interactions.push(entry.duration);
      }
    });
    observer.observe({ type: 'event', buffered: true });

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden' && interactions.length) {
          interactions.sort((a, b) => b - a);
          const p98 = interactions[Math.floor(interactions.length * 0.02)] || interactions[0];
          console.debug('[Web Vitals] INP:', Math.round(p98), 'ms');
        }
      },
      { once: true }
    );
  } catch {}
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;
  observeLCP();
  observeCLS();
  observeINP();
}

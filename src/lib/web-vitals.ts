/**
 * Web Vitals monitoring (privacy-first — console only, no external reporting)
 * Tracks LCP, CLS, INP for performance awareness
 */

function observeLCP(): void {
  if (!('PerformanceObserver' in window)) return;
  try {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        console.debug('[Web Vitals] LCP:', Math.round((last as PerformanceEntry & { startTime: number }).startTime), 'ms');
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* PerformanceObserver desteklenmiyor */ }
}

function observeCLS(): void {
  if (!('PerformanceObserver' in window)) return;
  let clsValue = 0;
  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value: number }).value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') {
          console.debug('[Web Vitals] CLS:', clsValue.toFixed(4));
        }
      },
      { once: true }
    );
  } catch { /* PerformanceObserver desteklenmiyor */ }
}

function observeINP(): void {
  if (!('PerformanceObserver' in window)) return;
  const interactions: number[] = [];
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
  } catch { /* PerformanceObserver desteklenmiyor */ }
}

export function initWebVitals(): void {
  if (typeof window === 'undefined') return;
  observeLCP();
  observeCLS();
  observeINP();
}

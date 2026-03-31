/**
 * Global tooltip and backdrop management
 */

let activeTooltip: HTMLElement | null = null;

// Create and append backdrop
const backdrop: HTMLElement | null =
  typeof document !== 'undefined'
    ? (() => {
        const el = document.createElement('div');
        el.id = 'tooltip-backdrop';
        document.body.appendChild(el);
        return el;
      })()
    : null;

/**
 * Close active tooltip and hide backdrop
 */
export function closeActiveTooltip(): void {
  if (activeTooltip) {
    activeTooltip.classList.remove('visible');
    activeTooltip = null;
  }
  if (backdrop) {
    backdrop.classList.remove('visible');
  }
}

/**
 * Set active tooltip
 */
export function setActiveTooltip(tooltip: HTMLElement): void {
  activeTooltip = tooltip;
}

/**
 * Get active tooltip
 */
export function getActiveTooltip(): HTMLElement | null {
  return activeTooltip;
}

/**
 * Show backdrop
 */
export function showBackdrop(): void {
  if (backdrop) {
    backdrop.classList.add('visible');
  }
}

/**
 * Initialize tooltip event listeners
 */
export function initTooltipListeners(): void {
  if (typeof document === 'undefined') return;

  if (backdrop) {
    backdrop.onclick = () => {
      closeActiveTooltip();
    };
  }

  document.addEventListener(
    'click',
    e => {
      // Always close tooltip on any click outside of it
      if (!activeTooltip) return;
      const t = e.target as HTMLElement;
      try {
        // Keep open if clicking inside tooltip or on info button
        if (activeTooltip.contains(t)) return;
        if (t.closest && t.closest('button.info-button')) return;
        if (t.closest && t.closest('.custom-tooltip')) return;
      } catch {}
      closeActiveTooltip();
    },
    true
  ); // Use capture phase to get event first
}

// Initialize on module load
if (typeof document !== 'undefined') {
  initTooltipListeners();
}

export { backdrop };

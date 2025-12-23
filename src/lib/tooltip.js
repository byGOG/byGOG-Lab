/**
 * Global tooltip and backdrop management
 */

let activeTooltip = null;

// Create and append backdrop
const backdrop = typeof document !== 'undefined' ? (() => {
  const el = document.createElement('div');
  el.id = 'tooltip-backdrop';
  document.body.appendChild(el);
  return el;
})() : null;

/**
 * Close active tooltip and hide backdrop
 */
export function closeActiveTooltip() {
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
 * @param {HTMLElement} tooltip
 */
export function setActiveTooltip(tooltip) {
  activeTooltip = tooltip;
}

/**
 * Get active tooltip
 * @returns {HTMLElement|null}
 */
export function getActiveTooltip() {
  return activeTooltip;
}

/**
 * Show backdrop
 */
export function showBackdrop() {
  if (backdrop) {
    backdrop.classList.add('visible');
  }
}

/**
 * Initialize tooltip event listeners
 */
export function initTooltipListeners() {
  if (typeof document === 'undefined') return;
  
  if (backdrop) {
    backdrop.onclick = () => {
      closeActiveTooltip();
    };
  }

  document.addEventListener('click', e => {
    // Always close tooltip on any click outside of it
    if (!activeTooltip) return;
    const t = e.target;
    try {
      // Keep open if clicking inside tooltip or on info button
      if (activeTooltip.contains(t)) return;
      if (t.closest && t.closest('button.info-button')) return;
      if (t.closest && t.closest('.custom-tooltip')) return;
    } catch {}
    closeActiveTooltip();
  }, true); // Use capture phase to get event first
}

// Initialize on module load
if (typeof document !== 'undefined') {
  initTooltipListeners();
}

export { backdrop };

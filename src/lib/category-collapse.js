/**
 * Category collapse/expand functionality.
 * Allows users to collapse categories by clicking the heading.
 * State is persisted in localStorage.
 */

const STORAGE_KEY = 'bygog_collapsed';

/** @returns {Set<string>} */
function loadCollapsed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCollapsed(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

/**
 * Initialize collapse/expand on all category cards.
 * @param {HTMLElement} container - #links-container
 */
export function initCategoryCollapse(container) {
  if (!container) return;
  const collapsed = loadCollapsed();

  function setupCard(card) {
    const h2 = card.querySelector('h2');
    if (!h2 || h2.dataset.collapseInit) return;
    h2.dataset.collapseInit = '1';

    const slug = card.dataset.catSlug || h2.textContent.trim();

    // Add toggle indicator
    const toggle = document.createElement('span');
    toggle.className = 'collapse-toggle';
    toggle.setAttribute('aria-hidden', 'true');
    h2.appendChild(toggle);

    h2.style.cursor = 'pointer';
    h2.setAttribute('role', 'button');
    h2.setAttribute('tabindex', '0');

    // Restore collapsed state
    if (collapsed.has(slug)) {
      card.classList.add('is-collapsed');
      h2.setAttribute('aria-expanded', 'false');
    } else {
      h2.setAttribute('aria-expanded', 'true');
    }

    function toggleCollapse() {
      const isCollapsed = card.classList.toggle('is-collapsed');
      h2.setAttribute('aria-expanded', String(!isCollapsed));
      if (isCollapsed) collapsed.add(slug);
      else collapsed.delete(slug);
      saveCollapsed(collapsed);
    }

    h2.addEventListener('click', ev => {
      // Don't collapse if clicking a link inside h2
      if (ev.target.closest('a')) return;
      toggleCollapse();
    });

    h2.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggleCollapse();
      }
    });
  }

  // Setup existing cards
  container.querySelectorAll('.category-card').forEach(setupCard);

  // Watch for new cards (lazy loaded)
  try {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList?.contains('category-card')) setupCard(node);
          if (node.nodeType === 1) node.querySelectorAll?.('.category-card').forEach(setupCard);
        });
      }
    });
    mo.observe(container, { childList: true, subtree: true });
  } catch {}
}

/**
 * Quick filter bar for links
 * Default view: Recommended. Category tabs show individual categories.
 * "All" is never a user-facing state — recommended is always the fallback.
 *
 * Uses tab-based rendering: only the active tab's matching items stay in the DOM.
 * Non-matching category cards are detached (not just hidden) for better performance.
 */
import { t } from './i18n.js';
import { writeUrlState } from './url-state.js';
import { getCategoryIcon } from './category-icons.js';

let activeFilter = 'recommended';
let activeCategory: string | null = null;

/**
 * Get the currently active quick filter key.
 */
export function getActiveFilter(): string {
  return activeFilter;
}

/**
 * Initialize the quick filter bar above the links container.
 */
export function initQuickFilters(container: HTMLElement): void {
  if (!container) return;

  const bar = document.createElement('div');
  bar.className = 'quick-filter-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', t('filter.quickLabel'));

  // --- Filter buttons row ---
  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';

  const filters: { key: string; i18nKey: string }[] = [];

  // --- Category tabs row ---
  const catRow = document.createElement('div');
  catRow.className = 'category-tab-row';

  let observer: MutationObserver | null = null;
  let applyingFilter = false;

  /** All category cards, kept for restore */
  let allCards: HTMLElement[] = [];
  /** Map: categoryIndex -> card element */
  const cardByIndex: Map<string, HTMLElement> = new Map();
  /** Currently detached cards (from filter or category selection) */
  const detachedCards: Set<HTMLElement> = new Set();

  function collectCards(): void {
    allCards = Array.from(container.querySelectorAll('.category-card')) as HTMLElement[];
    allCards.forEach(card => {
      const idx = card.dataset.categoryIndex;
      if (idx != null) cardByIndex.set(idx, card);
    });
  }

  function restoreAllCards(): void {
    // Re-insert all detached cards in order
    if (!detachedCards.size) return;
    const children = Array.from(container.children) as HTMLElement[];
    for (const card of detachedCards) {
      const pos = parseInt(card.dataset?.categoryIndex ?? '-1', 10);
      let inserted = false;
      for (let i = 0; i < children.length; i++) {
        const childPos = parseInt(children[i].dataset?.categoryIndex ?? '-1', 10);
        if (childPos > pos) {
          container.insertBefore(card, children[i]);
          inserted = true;
          break;
        }
      }
      if (!inserted) container.appendChild(card);
      children.length = 0;
      children.push(...(Array.from(container.children) as HTMLElement[]));
    }
    detachedCards.clear();
  }

  function cardHasItems(card: HTMLElement, filterKey: string): boolean {
    if (filterKey === 'all' || filterKey === 'category') return true;
    if (filterKey === 'recommended') {
      return card.querySelector('li[data-recommended="1"]') !== null;
    }
    if (filterKey === 'has-copy') {
      return card.querySelector('li.has-copy') !== null;
    }
    return true;
  }

  /**
   * Apply filter + category selection.
   */
  function applyFilter(filterKey: string, catIdx: string | null, opts: { skipUrl?: boolean } = {}): void {
    if (applyingFilter) return;
    applyingFilter = true;
    if (observer) observer.disconnect();

    activeFilter = filterKey;
    activeCategory = catIdx;
    if (!opts.skipUrl) {
      writeUrlState({ filter: filterKey });
    }

    // Restore all cards first
    restoreAllCards();

    // Remove all filter classes
    container.classList.remove('filter-recommended', 'filter-has-copy');

    // Strips (recent-strip always stays visible)
    const hideableStrips = container.parentElement?.querySelectorAll(
      '.featured-strip, .new-additions-strip'
    );

    const isCatSelected = catIdx !== null;

    // Hide non-recent strips when a specific category is selected
    if (hideableStrips) {
      hideableStrips.forEach(s => ((s as HTMLElement).style.display = isCatSelected ? 'none' : ''));
    }

    // Add filter class
    if (filterKey === 'recommended') container.classList.add('filter-recommended');
    else if (filterKey === 'has-copy') container.classList.add('filter-has-copy');

    {
      // Detach cards that don't match
      container.querySelectorAll('.category-card').forEach(card => {
        const el = card as HTMLElement;
        const idx = el.dataset.categoryIndex;
        const matchesCat = !isCatSelected || idx === catIdx;
        const matchesFilter = cardHasItems(el, filterKey);

        if (!matchesCat || !matchesFilter) {
          detachedCards.add(el);
          el.remove();
        } else {
          el.style.display = '';
        }
      });

      // Hide empty subcategories
      container.querySelectorAll('.sub-category').forEach(sub => {
        const el = sub as HTMLElement;
        if (filterKey === 'all' || filterKey === 'category') {
          el.style.display = '';
        } else {
          let hasVisible = false;
          if (filterKey === 'recommended') {
            hasVisible = el.querySelector('li[data-recommended="1"]') !== null;
          } else if (filterKey === 'has-copy') {
            hasVisible = el.querySelector('li.has-copy') !== null;
          }
          el.style.display = hasVisible ? '' : 'none';
        }
      });
    }

    // Update filter button states
    filterRow.querySelectorAll('.quick-filter-btn').forEach(btn => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.filter === filterKey);
    });

    // Update category tab states
    catRow.querySelectorAll('.category-tab-btn').forEach(btn => {
      const el = btn as HTMLElement;
      if (el.dataset.filter === 'recommended') {
        el.classList.toggle('active', filterKey === 'recommended' && !isCatSelected);
      } else {
        el.classList.toggle('active', el.dataset.catIndex === catIdx);
      }
    });

    updateCounts();

    if (observer) observer.observe(container, { childList: true, subtree: true });
    applyingFilter = false;

    window.dispatchEvent(new CustomEvent('quickfilterchange', { detail: { filter: filterKey } }));
  }

  function updateCounts(): void {
    let allCount = 0;
    let recCount = 0;
    let copyCount = 0;

    // Count from container
    container.querySelectorAll('.category-card li').forEach(li => {
      allCount++;
      if ((li as HTMLElement).dataset.recommended === '1') recCount++;
      if (li.classList.contains('has-copy')) copyCount++;
    });

    // Count from detached
    for (const card of detachedCards) {
      card.querySelectorAll('li').forEach(li => {
        allCount++;
        if (li.dataset.recommended === '1') recCount++;
        if (li.classList.contains('has-copy')) copyCount++;
      });
    }

    // Update count on recommended tab
    const recTab = catRow.querySelector('.category-tab-recommended .filter-count');
    if (recTab) recTab.textContent = String(recCount);

    filterRow.querySelectorAll('.quick-filter-btn').forEach(btn => {
      const el = btn as HTMLElement;
      const countEl = el.querySelector('.filter-count');
      if (!countEl) return;
      if (el.dataset.filter === 'all') countEl.textContent = String(allCount);
      else if (el.dataset.filter === 'recommended') countEl.textContent = String(recCount);
      else if (el.dataset.filter === 'has-copy') countEl.textContent = String(copyCount);
    });
  }

  // --- Build filter buttons ---
  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-filter-btn';
    btn.dataset.filter = f.key;
    btn.dataset.i18nKey = f.i18nKey;
    btn.innerHTML = `${t(f.i18nKey)} <span class="filter-count"></span>`;
    btn.addEventListener('click', () => {
      // Toggle: clicking active filter goes back to 'recommended'
      if (activeFilter === f.key) {
        applyFilter('recommended', null);
      } else {
        applyFilter(f.key, activeCategory);
      }
    });
    filterRow.appendChild(btn);
  });

  bar.appendChild(filterRow);

  // --- Build category tabs (populated after categories load) ---
  function buildCategoryTabs(): void {
    catRow.innerHTML = '';
    // Use all cards (including detached) so tabs always show every category
    const domCards = Array.from(container.querySelectorAll('.category-card')) as HTMLElement[];
    const combined = [...domCards, ...Array.from(detachedCards)];
    // Deduplicate and sort by categoryIndex
    const seen = new Set<string>();
    const cards = combined
      .filter(c => {
        const idx = c.dataset.categoryIndex;
        if (idx == null || seen.has(idx)) return false;
        seen.add(idx);
        return true;
      })
      .sort((a, b) => parseInt(a.dataset.categoryIndex!) - parseInt(b.dataset.categoryIndex!));
    if (!cards.length) return;

    collectCards();

    // "Önerilen" tab — first in row, acts as a filter
    const recBtn = document.createElement('button');
    recBtn.type = 'button';
    recBtn.className = 'category-tab-btn category-tab-recommended';
    recBtn.dataset.filter = 'recommended';
    recBtn.dataset.i18nKey = 'filter.recommended';
    const starIcon = document.createElement('span');
    starIcon.className = 'category-tab-icon';
    starIcon.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    recBtn.appendChild(starIcon);
    const recText = document.createElement('span');
    recText.textContent = t('filter.recommended');
    recBtn.appendChild(recText);
    const recCount = document.createElement('span');
    recCount.className = 'filter-count';
    recBtn.appendChild(recCount);
    recBtn.addEventListener('click', () => {
      // Always stay on recommended — never go to 'all'
      if (activeFilter !== 'recommended' || activeCategory !== null) {
        applyFilter('recommended', null);
      }
    });
    catRow.appendChild(recBtn);

    cards.forEach(card => {
      const h2 = card.querySelector('h2');
      if (!h2) return;
      const idx = card.dataset.categoryIndex;
      const title = h2.textContent?.replace(/\d+$/, '').trim() || '';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-tab-btn';
      btn.dataset.catIndex = idx;

      const iconSvg = getCategoryIcon(title);
      if (iconSvg) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'category-tab-icon';
        iconSpan.innerHTML = iconSvg;
        btn.appendChild(iconSpan);
      }

      const textSpan = document.createElement('span');
      textSpan.textContent = title;
      btn.appendChild(textSpan);

      btn.addEventListener('click', () => {
        if (activeCategory === idx) {
          // Clicking active category again → deselect, go back to recommended
          applyFilter('recommended', null);
        } else {
          // Selecting a category → show all items in that category (internally 'all' but only for that category)
          applyFilter('category', idx!);
        }
      });

      catRow.appendChild(btn);
    });
  }

  bar.appendChild(catRow);

  // Move search input into the filter bar (header is hidden)
  const searchContainer = document.querySelector('.site-header .search-container');
  if (searchContainer) {
    const searchRow = document.createElement('div');
    searchRow.className = 'filter-search-row';
    searchRow.appendChild(searchContainer);
    bar.insertBefore(searchRow, catRow);
  }

  container.parentElement!.insertBefore(bar, container);

  /** Track total known categories (DOM + detached) */
  let knownCatCount = 0;

  // --- Observer for lazy-loaded categories ---
  observer = new MutationObserver(() => {
    // Rebuild category tabs only if genuinely new cards appeared
    const totalCards = container.querySelectorAll('.category-card').length + detachedCards.size;
    if (totalCards > knownCatCount) {
      knownCatCount = totalCards;
      buildCategoryTabs();
    }
    applyFilter(activeFilter, activeCategory, { skipUrl: true });
  });
  observer.observe(container, { childList: true, subtree: true });

  // Initial build — default to 'recommended' unless URL says otherwise
  setTimeout(() => {
    buildCategoryTabs();
    updateCounts();
    // Always start with 'recommended' — 'all' is never a user-facing state
    applyFilter('recommended', null, { skipUrl: true });
  }, 100);

  // When search is active, restore all cards so the search engine can index everything
  let searchSuspended = false;
  window.addEventListener('searchactive', () => {
    if (searchSuspended) return;
    searchSuspended = true;
    if (observer) observer.disconnect();
    restoreAllCards();
    // Show all cards/subcategories so search can use them
    container.querySelectorAll('.category-card').forEach(card => {
      (card as HTMLElement).style.display = '';
    });
    container.querySelectorAll('.sub-category').forEach(sub => {
      (sub as HTMLElement).style.display = '';
    });
    container.classList.remove('filter-recommended', 'filter-has-copy');
  });

  window.addEventListener('searchclear', () => {
    if (!searchSuspended) return;
    searchSuspended = false;
    // Re-apply active filter
    applyFilter(activeFilter, activeCategory, { skipUrl: true });
  });

  // Re-render labels on language change
  window.addEventListener('langchange', () => {
    bar.setAttribute('aria-label', t('filter.quickLabel'));
    // Update recommended tab label
    const recTabBtn = catRow.querySelector('.category-tab-recommended');
    if (recTabBtn) {
      const textSpan = recTabBtn.querySelector('span:not(.category-tab-icon):not(.filter-count)');
      if (textSpan) textSpan.textContent = t('filter.recommended');
    }
    filterRow.querySelectorAll('.quick-filter-btn').forEach(btn => {
      const el = btn as HTMLElement;
      const key = el.dataset.i18nKey;
      if (!key) return;
      const countEl = el.querySelector('.filter-count');
      const countText = countEl ? countEl.textContent : '';
      el.innerHTML = `${t(key)} <span class="filter-count">${countText}</span>`;
    });
  });
}

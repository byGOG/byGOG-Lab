/**
 * Quick filter bar for links
 * Filters: All, Recommended, Has Command
 */
import { t } from './i18n.js';
import { readUrlState, writeUrlState } from './url-state.js';

/**
 * Initialize the quick filter bar above the links container.
 * @param {HTMLElement} container - #links-container
 */
export function initQuickFilters(container) {
  if (!container) return;

  const bar = document.createElement('div');
  bar.className = 'quick-filter-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', t('filter.quickLabel'));

  const filters = [
    { key: 'all', i18nKey: 'filter.all' },
    { key: 'recommended', i18nKey: 'filter.recommended' },
    { key: 'has-copy', i18nKey: 'filter.hasCopy' }
  ];

  let activeFilter = 'all';

  function applyFilter(key, opts = {}) {
    activeFilter = key;
    if (!opts.skipUrl) writeUrlState({ filter: key });
    const allItems = container.querySelectorAll('.category-card li');
    const allCards = container.querySelectorAll('.category-card');
    const allSubs = container.querySelectorAll('.sub-category');

    allItems.forEach(li => {
      if (key === 'all') {
        li.classList.remove('filter-hidden');
      } else if (key === 'recommended') {
        li.classList.toggle('filter-hidden', li.dataset.recommended !== '1');
      } else if (key === 'has-copy') {
        li.classList.toggle('filter-hidden', !li.classList.contains('has-copy'));
      }
    });

    // Hide empty subcategories and categories
    allSubs.forEach(sub => {
      const visible = sub.querySelectorAll('li:not(.filter-hidden):not(.is-hidden)');
      sub.style.display = visible.length ? '' : 'none';
    });

    allCards.forEach(card => {
      if (key === 'all') {
        card.style.display = '';
        return;
      }
      const visible = card.querySelectorAll('li:not(.filter-hidden):not(.is-hidden)');
      card.style.display = visible.length ? '' : 'none';
    });

    // Update button states
    bar.querySelectorAll('.quick-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === key);
    });

    // Update counts
    updateCounts();
  }

  function updateCounts() {
    const allItems = container.querySelectorAll('.category-card li');
    const recCount = container.querySelectorAll('.category-card li[data-recommended="1"]').length;
    const copyCount = container.querySelectorAll('.category-card li.has-copy').length;

    bar.querySelectorAll('.quick-filter-btn').forEach(btn => {
      const countEl = btn.querySelector('.filter-count');
      if (!countEl) return;
      if (btn.dataset.filter === 'all') countEl.textContent = allItems.length;
      else if (btn.dataset.filter === 'recommended') countEl.textContent = recCount;
      else if (btn.dataset.filter === 'has-copy') countEl.textContent = copyCount;
    });
  }

  filters.forEach(f => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-filter-btn' + (f.key === 'all' ? ' active' : '');
    btn.dataset.filter = f.key;
    btn.dataset.i18nKey = f.i18nKey;
    btn.innerHTML = `${t(f.i18nKey)} <span class="filter-count"></span>`;
    btn.addEventListener('click', () => applyFilter(f.key));
    bar.appendChild(btn);
  });

  container.parentElement.insertBefore(bar, container);

  // Observe for dynamically loaded categories to update counts
  const observer = new MutationObserver(() => {
    if (activeFilter === 'all') updateCounts();
    else applyFilter(activeFilter);
  });
  observer.observe(container, { childList: true, subtree: true });

  // Initial count update after a tick (categories may still be loading)
  setTimeout(updateCounts, 100);

  // Apply filter from URL state
  try {
    const urlState = readUrlState();
    if (urlState.filter && urlState.filter !== 'all') {
      setTimeout(() => applyFilter(urlState.filter, { skipUrl: true }), 150);
    }
  } catch {}

  // Re-render labels on language change
  window.addEventListener('langchange', () => {
    bar.setAttribute('aria-label', t('filter.quickLabel'));
    bar.querySelectorAll('.quick-filter-btn').forEach(btn => {
      const key = btn.dataset.i18nKey;
      if (!key) return;
      const countEl = btn.querySelector('.filter-count');
      const countText = countEl ? countEl.textContent : '';
      btn.innerHTML = `${t(key)} <span class="filter-count">${countText}</span>`;
    });
  });
}

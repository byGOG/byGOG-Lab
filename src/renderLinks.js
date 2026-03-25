import { initBackToTop } from './back-to-top.js';
import { initCategoryNav } from './category-nav.js';
import { initWebVitals } from './lib/web-vitals.js';
import { initGlobalErrorHandler } from './lib/global-error-handler.js';
import { initI18n, t, applyI18nToDom } from './lib/i18n.js';
import { readUrlState, writeUrlState } from './lib/url-state.js';
import { isNewLink, updateKnownLinks } from './lib/new-badge.js';
import { trackClick, renderRecentStrip, getVisitedNames } from './lib/recent-links.js';
import { initQuickFilters } from './lib/quick-filters.js';
import { initCategoryCollapse } from './lib/category-collapse.js';
import { initWebShare } from './lib/web-share.js';
import { initScrollRestore } from './lib/scroll-restore.js';
import { initSearchSuggest } from './lib/search-suggest.js';

import { renderFeaturedStrip } from './lib/featured-strip.js';
import { renderNewAdditionsStrip } from './lib/new-additions-strip.js';
import { initBatchInstall } from './lib/batch-install.js';
import { initKeyboardHelp } from './lib/keyboard-help.js';
import { initOfflineBanner } from './lib/offline-banner.js';

// Import from modular libraries
import { fetchLinks } from './lib/data-fetcher.js';
import { closeActiveTooltip } from './lib/tooltip.js';
import { isSvgIcon } from './lib/domain-utils.js';
import { createLinkItem as createLinkItemModule } from './lib/link-item.js';
import { getCategoryIcon, getSubcategoryIcon, applyCategoryColumns } from './lib/category-icons.js';
import {
  resolveCopyValue,
  setCopyIconOnButton,
  copyToClipboard,
  setupCopyDelegation
} from './lib/copy-utils.js';
import {
  foldForSearch,
  createWorkerSearchEngine,
  createSyncSearchEngine
} from './lib/search-engine.js';
import { setupPWAInstallUI } from './lib/pwa-install.js';
import { initLazyCategories as initLazyCategoriesModule } from './lazy-loader.js';
import * as logger from './lib/logger.js';

// Re-export fetchLinks for external use
export { fetchLinks };

let cachedData = null;
let lazyState = null;
let searchState = null;

function createLinkItem(link) {
  return createLinkItemModule(link, {
    isSvgIcon,
    resolveCopyValue,
    setCopyIconOnButton,
    copyToClipboard,
    isNewLink
  });
}

function renderCategoriesLegacy(data, container) {
  cachedData = data;
  const frag = document.createDocumentFragment();

  data.categories.forEach(cat => {
    const card = document.createElement('article');
    card.className = 'category-card';
    // Force 3-column layout specifically for "Sistem/Ofis"
    try {
      const ct = String(cat.title).trim();
      const ctf =
        typeof foldForSearch === 'function' ? foldForSearch(ct) : ct.toLocaleLowerCase('tr');
      const ctfn = ctf.replace(/\u0131/g, 'i');
      // Apply 3 columns for selected categories (normalized in TR locale)
      const threeColTitles = new Set([
        'sistem/ofis',
        'sistem araclari & bakim',
        'guvenlik & gizlilik',
        'yazilim & paket yoneticileri'
      ]);
      if (threeColTitles.has(ctfn)) {
        card.classList.add('cols-3');
      }
    } catch {}

    const h2 = document.createElement('h2');
    h2.textContent = cat.title;
    card.appendChild(h2);

    const renderList = (links, parent, catTitle, subTitle) => {
      const ul = document.createElement('ul');
      // Sort inside groups alphabetically (tr): recommended A-Z, others A-Z
      const cmp = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'tr');
      const sorted = links.filter(item => !item?.hidden).sort(cmp);

      const catTokens = [catTitle, subTitle].filter(Boolean).join(' ').toLocaleLowerCase('tr');
      sorted.forEach(item => {
        const li = createLinkItem(item);
        try {
          const base = String(li.dataset.search || '');
          const groupTokens = item.recommended ? 'onerilen onerilenler' : 'diger digerleri';
          li.dataset.search = `${base} ${groupTokens} ${catTokens}`.trim();
        } catch {}
        ul.appendChild(li);
      });
      parent.appendChild(ul);
    };

    if (cat.subcategories) {
      const subWrap = document.createElement('div');
      subWrap.className = 'sub-category-container';
      cat.subcategories.forEach(sub => {
        const sc = document.createElement('section');
        sc.className = 'sub-category';
        const h3 = document.createElement('h3');

        const subIconSvg = getSubcategoryIcon(sub.title);
        if (subIconSvg) {
          const subIconSpan = document.createElement('span');
          subIconSpan.className = 'subcategory-icon';
          subIconSpan.innerHTML = subIconSvg;
          h3.appendChild(subIconSpan);
        }

        const subTitleSpan = document.createElement('span');
        subTitleSpan.textContent = sub.title;
        h3.appendChild(subTitleSpan);

        sc.appendChild(h3);
        renderList(sub.links, sc, cat.title, sub.title);
        subWrap.appendChild(sc);
      });
      card.appendChild(subWrap);
    } else if (cat.links) {
      renderList(cat.links, card, cat.title, null);
    }

    frag.appendChild(card);
  });
  container.appendChild(frag);
}

// Category icons and columns imported from ./lib/category-icons.js

function createCategoryCard(title) {
  const card = document.createElement('article');
  card.className = 'category-card';
  const h2 = document.createElement('h2');

  // Add category icon
  const iconSvg = getCategoryIcon(title);
  if (iconSvg) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'category-icon';
    iconSpan.innerHTML = iconSvg;
    h2.appendChild(iconSpan);
  }

  const titleSpan = document.createElement('span');
  titleSpan.textContent = title || '';
  h2.appendChild(titleSpan);

  card.appendChild(h2);
  applyCategoryColumns(card, title);
  return card;
}

function renderLinkList(links, parent, catTitle, subTitle) {
  if (!Array.isArray(links)) return;
  const ul = document.createElement('ul');
  const cmp = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'tr');
  const sorted = links.filter(item => !item?.hidden).sort(cmp);
  const catTokens = [catTitle, subTitle].filter(Boolean).join(' ').toLocaleLowerCase('tr');

  sorted.forEach(item => {
    const li = createLinkItem(item);
    try {
      const base = String(li.dataset.search || '');
      const groupTokens = item.recommended ? 'onerilen onerilenler' : 'diger digerleri';
      li.dataset.search = `${base} ${groupTokens} ${catTokens}`.trim();
    } catch {}
    ul.appendChild(li);
  });
  parent.appendChild(ul);
}

function renderCategoryContent(cat, card) {
  if (!cat) return null;
  const title = cat.title || '';
  const cardEl = card || createCategoryCard(title);
  let h2 = cardEl.querySelector('h2');
  if (!h2) {
    h2 = document.createElement('h2');
    cardEl.textContent = '';
    cardEl.appendChild(h2);
  }

  // Clear h2 and add icon + title
  h2.innerHTML = '';
  const iconSvg = getCategoryIcon(title);
  if (iconSvg) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'category-icon';
    iconSpan.innerHTML = iconSvg;
    h2.appendChild(iconSpan);
  }
  const titleSpan = document.createElement('span');
  titleSpan.textContent = title;
  h2.appendChild(titleSpan);

  // Calculate total visible link count and add badge
  let totalLinks = 0;
  if (Array.isArray(cat.subcategories)) {
    totalLinks = cat.subcategories.reduce(
      (sum, sub) => sum + (Array.isArray(sub.links) ? sub.links.filter(l => !l?.hidden).length : 0),
      0
    );
  } else if (Array.isArray(cat.links)) {
    totalLinks = cat.links.filter(l => !l?.hidden).length;
  }
  if (totalLinks > 0) {
    const badge = document.createElement('span');
    badge.className = 'category-count';
    badge.textContent = totalLinks;
    h2.appendChild(badge);
  }
  cardEl.dataset.catCount = totalLinks;

  applyCategoryColumns(cardEl, title);

  let node = h2.nextSibling;
  while (node) {
    const next = node.nextSibling;
    node.remove();
    node = next;
  }

  if (Array.isArray(cat.subcategories) && cat.subcategories.length) {
    const subWrap = document.createElement('div');
    subWrap.className = 'sub-category-container';
    cat.subcategories.forEach(sub => {
      const sc = document.createElement('section');
      sc.className = 'sub-category';
      const h3 = document.createElement('h3');

      const subIconSvg = getSubcategoryIcon(sub.title);
      if (subIconSvg) {
        const subIconSpan = document.createElement('span');
        subIconSpan.className = 'subcategory-icon';
        subIconSpan.innerHTML = subIconSvg;
        h3.appendChild(subIconSpan);
      }

      const subTitleSpan = document.createElement('span');
      subTitleSpan.textContent = sub.title || '';
      h3.appendChild(subTitleSpan);

      sc.appendChild(h3);
      renderLinkList(sub.links, sc, title, sub.title);
      subWrap.appendChild(sc);
    });
    cardEl.appendChild(subWrap);
  } else if (Array.isArray(cat.links)) {
    renderLinkList(cat.links, cardEl, title, null);
  }

  return cardEl;
}

function renderCategories(data, container) {
  if (!data || !Array.isArray(data.categories)) return;
  renderCategoriesLegacy(data, container);
}

function initLazyCategories(indexData, container) {
  cachedData = { categories: [] };

  const state = initLazyCategoriesModule(indexData, container, {
    createCategoryCard,
    renderCategoryContent,
    getCachedCategories: () => cachedData.categories,
    onCategoryLoaded: () => {
      refreshSearchIndex();
      markVisitedLinks(container);
      // Cache loaded icons in service worker for offline use
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        const urls = [
          ...new Set(
            [...document.querySelectorAll('.site-icon[src]')]
              .map(img => img.getAttribute('src'))
              .filter(src => src && src.includes('icon/'))
          )
        ];
        if (urls.length) {
          navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', urls });
        }
      }
    }
  });

  lazyState = state;
  return state;
}

function markVisitedLinks(container) {
  try {
    const visited = getVisitedNames();
    if (!visited.size) return;
    container.querySelectorAll('li[data-name-original]').forEach(li => {
      if (visited.has(li.dataset.nameOriginal)) li.classList.add('is-visited');
    });
  } catch {}
}

function areAllCategoriesLoaded() {
  if (!lazyState) return true;
  if (typeof lazyState.allLoaded === 'function') return lazyState.allLoaded();
  return lazyState.entries.every(entry => entry.loaded);
}

function getNavCardFromDetail(detail) {
  if (!detail) return null;
  if (detail.card && detail.card.classList && detail.card.classList.contains('category-card')) {
    return detail.card;
  }
  const slug = detail.slug ? String(detail.slug) : '';
  if (slug) {
    const card = document.querySelector(`.category-card[data-cat-slug="${slug}"]`);
    if (card) return card;
  }
  const id = detail.id ? String(detail.id) : '';
  if (id) return document.querySelector(`.category-card[data-cat-id="${id}"]`);
  return null;
}

function ensureLazyCategoryLoaded(card) {
  if (!lazyState || !card || typeof lazyState.loadCategory !== 'function') return;
  const idx = Number(card.dataset.categoryIndex || '-1');
  if (!Number.isFinite(idx) || idx < 0) return;
  const entry = lazyState.entries && lazyState.entries[idx];
  if (!entry) return;
  lazyState.loadCategory(entry);
}

document.addEventListener('category-nav-select', ev => {
  try {
    const card = getNavCardFromDetail(ev.detail);
    ensureLazyCategoryLoaded(card);
  } catch {}
});

function buildSearchDataset() {
  const nodes = Array.from(document.querySelectorAll('.category-card li'));
  nodes.forEach((el, index) => {
    el.dataset.searchIndex = String(index);
  });

  const dataset = nodes.map((el, index) => {
    const raw = el.dataset.search || el.textContent || '';
    const catEl = el.closest('.category-card');
    const subEl = el.closest('.sub-category');
    return {
      index,
      folded: el.dataset.folded ? String(el.dataset.folded) : foldForSearch(raw),
      nameFolded: el.dataset.nameSearch ? foldForSearch(el.dataset.nameSearch) : '',
      recommended: el.dataset.recommended === '1',
      isLink: !!el.querySelector('.link-text'),
      catEl,
      subEl,
      catSlug: catEl ? catEl.dataset.catSlug || '' : ''
    };
  });

  return { nodes, dataset };
}

function refreshSearchIndex(options = {}) {
  if (!searchState) return;
  const { nodes, dataset } = buildSearchDataset();
  searchState.nodes = nodes;
  searchState.dataset = dataset;
  if (searchState.engine && searchState.engine.dispose) searchState.engine.dispose();
  searchState.engine = null;

  if (nodes.length) {
    try {
      searchState.engine =
        createWorkerSearchEngine(nodes, dataset, searchState.status) ||
        createSyncSearchEngine(nodes, dataset, searchState.status);
    } catch {
      searchState.engine = createSyncSearchEngine(nodes, dataset, searchState.status);
    }
  }

  if (options.runQuery === false) return;
  const value = searchState.input.value || '';
  const scope = searchState.categoryScope ? searchState.categoryScope.slug : '';
  if (searchState.engine) {
    searchState.engine.run(value, scope);
  } else if (value.trim()) {
    searchState.status.textContent = t('search.loading');
  } else {
    searchState.status.textContent = '';
  }
}

function setupSearch() {
  const input = document.getElementById('search-input');
  const status = document.getElementById('search-status');
  if (!input || !status) return;
  if (searchState) return searchState;

  searchState = {
    input,
    status,
    engine: null,
    nodes: [],
    dataset: [],
    categoryScope: null // { slug, title }
  };

  // Category scope UI
  const scopeChip = document.createElement('span');
  scopeChip.className = 'search-scope-chip';
  scopeChip.hidden = true;
  const scopeLabel = document.createElement('span');
  scopeLabel.className = 'search-scope-label';
  const scopeClear = document.createElement('button');
  scopeClear.type = 'button';
  scopeClear.className = 'search-scope-clear';
  scopeClear.setAttribute('aria-label', t('scope.clear'));
  scopeClear.innerHTML = '×';
  scopeClear.addEventListener('click', () => {
    clearCategoryScope();
    input.focus();
  });
  scopeChip.appendChild(scopeLabel);
  scopeChip.appendChild(scopeClear);
  const searchContainer = input.closest('.search-container') || input.parentElement;
  if (searchContainer) searchContainer.insertBefore(scopeChip, input);

  function setCategoryScope(slug, title) {
    searchState.categoryScope = { slug, title };
    scopeLabel.textContent = title;
    scopeChip.hidden = false;
    input.setAttribute('placeholder', t('scope.label', { name: title }));
    writeUrlState({ cat: slug });
    // Re-run search with scope
    if (searchState.engine) searchState.engine.run(input.value, slug);
  }

  function clearCategoryScope() {
    searchState.categoryScope = null;
    scopeChip.hidden = true;
    input.setAttribute('placeholder', t('search.placeholder'));
    writeUrlState({ cat: null });
    // Re-run search without scope
    if (searchState.engine) searchState.engine.run(input.value, '');
  }

  // Listen for category nav clicks to set scope when search is focused/active
  document.addEventListener('category-nav-select', ev => {
    try {
      const detail = ev.detail;
      if (!detail || !detail.slug) return;
      const card =
        detail.card || document.querySelector(`.category-card[data-cat-slug="${detail.slug}"]`);
      const title = card
        ? card.querySelector('h2 span:last-child')?.textContent || detail.slug
        : detail.slug;
      setCategoryScope(detail.slug, title);
    } catch {}
  });

  // Expose for URL state restore
  searchState.setCategoryScope = setCategoryScope;
  searchState.clearCategoryScope = clearCategoryScope;

  refreshSearchIndex({ runQuery: false });

  let debounceTimer;
  function computeDelay(val) {
    const n = String(val || '').trim().length;
    if (n >= 8) return 80;
    if (n >= 4) return 120;
    return 250;
  }

  function maybeLoadAll(value) {
    const q = String(value || '').trim();
    if (!q) return false;
    if (!lazyState || areAllCategoriesLoaded()) return false;
    status.textContent = t('search.loading');
    if (!lazyState.loadAllPromise) lazyState.loadAllPromise = lazyState.loadAll();
    // After all categories load, restore cards, rebuild index and re-run query
    lazyState.loadAllPromise.then(() => {
      window.dispatchEvent(new CustomEvent('searchactive'));
      refreshSearchIndex({ runQuery: false });
      if (searchState.engine) {
        searchState.engine.run(input.value, getScope());
      }
    });
    return true;
  }

  function getScope() {
    return searchState.categoryScope ? searchState.categoryScope.slug : '';
  }

  function runImmediate(value) {
    clearTimeout(debounceTimer);
    if (maybeLoadAll(value)) return;
    if (!searchState.engine) refreshSearchIndex({ runQuery: false });
    if (searchState.engine) searchState.engine.run(value, getScope());
  }

  let searchWasActive = false;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const hasQuery = !!input.value.trim();
    const delay = computeDelay(input.value);
    // Show searching indicator while debouncing
    if (hasQuery && searchState.status) {
      searchState.status.textContent = t('search.loading');
    }

    // Restore all cards when search starts, re-apply filter when cleared
    if (hasQuery && !searchWasActive) {
      searchWasActive = true;
      window.dispatchEvent(new CustomEvent('searchactive'));
      // Rebuild search index after cards are restored
      refreshSearchIndex({ runQuery: false });
    } else if (!hasQuery && searchWasActive) {
      searchWasActive = false;
      window.dispatchEvent(new CustomEvent('searchclear'));
    }

    debounceTimer = setTimeout(() => {
      if (maybeLoadAll(input.value)) {
        writeUrlState({ q: (input.value || '').trim() || null });
        return;
      }
      if (!searchState.engine) refreshSearchIndex({ runQuery: false });
      try {
        if (searchState.engine) searchState.engine.run(input.value, getScope());
      } catch {
        refreshSearchIndex({ runQuery: true });
      }
      writeUrlState({ q: (input.value || '').trim() || null });
    }, delay);
  });

  document.addEventListener('keydown', ev => {
    const t = ev.target;
    const tag = t && t.tagName ? t.tagName.toUpperCase() : '';
    const inEditable = !!(
      t &&
      (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag))
    );

    if (
      (ev.ctrlKey || ev.metaKey) &&
      !ev.altKey &&
      !ev.shiftKey &&
      (ev.key === 'k' || ev.key === 'K')
    ) {
      ev.preventDefault();
      input.focus();
      input.select();
      return;
    }

    if (ev.ctrlKey && !ev.altKey && !ev.shiftKey && (ev.key === 'e' || ev.key === 'E')) {
      ev.preventDefault();
      input.focus();
      input.select();
      return;
    }

    if (
      (ev.key === '/' || ev.key === '.') &&
      !(ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey)
    ) {
      if (inEditable) return;
      ev.preventDefault();
      input.focus();
      input.select();
    }
  });

  input.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      if (input.value) {
        input.value = '';
        runImmediate('');
        writeUrlState({ q: null });
        if (searchWasActive) {
          searchWasActive = false;
          window.dispatchEvent(new CustomEvent('searchclear'));
        }
      }
      ev.stopPropagation();
    } else if (ev.key === 'Enter') {
      const q = (input.value || '').trim();
      if (!q) return;
      const firstLink = document.querySelector('.category-card li:not(.is-hidden) a[href]');
      if (firstLink) {
        firstLink.click();
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
  });

  try {
    const urlState = readUrlState();
    // Restore category scope from URL
    if (urlState.cat) {
      const card = document.querySelector(`.category-card[data-cat-slug="${urlState.cat}"]`);
      if (card) {
        const title = card.querySelector('h2 span:last-child')?.textContent || urlState.cat;
        setCategoryScope(urlState.cat, title);
      }
    }
    if (urlState.q) {
      input.value = urlState.q;
      if (!maybeLoadAll(urlState.q)) runImmediate(urlState.q);
    } else if (input.value) {
      runImmediate(input.value);
    }
  } catch {
    if (input.value) runImmediate(input.value);
  }

  return searchState;
}

function setupThemeToggle() {
  try {
    const c = document.querySelector('.theme-toggle-container');
    if (c) c.remove();
  } catch {}
  try {
    document.body.classList.add('koyu');
  } catch {}
}

document.addEventListener('DOMContentLoaded', async () => {
  setupThemeToggle();
  initKeyboardHelp();
  initOfflineBanner();
  initI18n();
  applyI18nToDom();
  initGlobalErrorHandler();
  initWebVitals();

  // Re-apply i18n to static DOM elements on language change
  window.addEventListener('langchange', () => applyI18nToDom());
  // Focus search input immediately on desktop for instant typing
  try {
    const input = document.getElementById('search-input');
    const isMobile =
      /android|iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (input && !isMobile) {
      input.focus();
      input.select();
    }
    if (input) {
      const clearOverlays = () => {
        closeActiveTooltip();
        try {
          const overlay = document.getElementById('info-overlay');
          const fly = document.getElementById('global-info-flyout');
          if (overlay) {
            overlay.classList.remove('show');
            overlay.setAttribute('aria-hidden', 'true');
          }
          if (fly) {
            fly.classList.remove('show');
            fly.setAttribute('aria-hidden', 'true');
          }
          document.body.classList.remove('modal-open');
        } catch {}
      };
      try {
        input.addEventListener('focus', clearOverlays);
      } catch {}
      try {
        input.addEventListener('pointerdown', clearOverlays);
      } catch {}
    }
  } catch {}
  const container = document.getElementById('links-container');
  try {
    const result = await fetchLinks();
    if (result && result.mode === 'index') {
      const state = initLazyCategories(result.data, container);
      // Wait for all categories to load before building nav with subcategories
      if (state && state.loadAllPromise) {
        await state.loadAllPromise;
      }
    } else if (result && result.data) {
      renderCategories(result.data, container);
    } else {
      renderCategories(result, container);
    }
    initCategoryNav();
    initBackToTop();
    // FAB scroll-away: hide when scrolling down, show when scrolling up
    try {
      const fab = document.querySelector('.author-fab');
      if (fab) {
        let lastY = window.scrollY;
        window.addEventListener(
          'scroll',
          () => {
            const y = window.scrollY;
            fab.classList.toggle('fab-hidden', y > lastY && y > 200);
            lastY = y;
          },
          { passive: true }
        );
      }
    } catch {}
    updateKnownLinks();
    renderRecentStrip(container);
    initQuickFilters(container);

    renderFeaturedStrip(container, cachedData);
    renderNewAdditionsStrip(container);
    initBatchInstall(container);
    initCategoryCollapse(container);
    initWebShare(container);
    initScrollRestore();
  } catch (err) {
    container.textContent = t('error.linksLoad');
    console.error(err);
  }
  setupCopyDelegation(document.getElementById('links-container'));
  // Track external link clicks for "Son Kullanılanlar"
  container.addEventListener('click', ev => {
    const a = ev.target.closest('.category-card li > a[href]');
    if (!a) return;
    const li = a.closest('li');
    if (!li) return;
    const name = li.dataset.nameOriginal;
    const iconEl = li.querySelector('.site-icon');
    const icon = iconEl ? iconEl.getAttribute('data-src') || iconEl.getAttribute('src') || '' : '';
    if (name && a.href) {
      trackClick(name, a.href, icon);
      li.classList.add('is-visited');
    }
  });
  setupSearch();
  initSearchSuggest(document.getElementById('search-input'), container);
  setupPWAInstallUI();

  // Logo / footer brand click → reset and scroll to top
  function handleHomeClick(ev) {
    ev.preventDefault();
    const input = document.getElementById('search-input');
    if (input && input.value) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (searchState && searchState.clearCategoryScope) searchState.clearCategoryScope();
    writeUrlState({ q: null, filter: null, tag: null, cat: null });
    try {
      history.replaceState(null, '', window.location.pathname);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const logoLink = document.querySelector('.logo-container');
  if (logoLink) logoLink.addEventListener('click', handleHomeClick);
  const footerHome = document.querySelector('.footer-home-link');
  if (footerHome) footerHome.addEventListener('click', handleHomeClick);
  document.addEventListener('keydown', ev => {
    const t = ev.target;
    const tag = t && t.tagName ? t.tagName.toUpperCase() : '';
    const inEditable = !!(
      t &&
      (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag))
    );

    if (ev.key === 'Escape') {
      closeActiveTooltip();
      // Help modalı kapat
      const helpModal = document.getElementById('keyboard-help-modal');
      if (helpModal) {
        helpModal.remove();
        return;
      }
    }

    if (inEditable || ev.ctrlKey || ev.metaKey || ev.altKey) return;

    // ? — klavye kısayolları yardım modalı
    if (ev.key === '?') {
      const existingModal = document.getElementById('keyboard-help-modal');
      if (existingModal) {
        existingModal.remove();
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'keyboard-help-modal';
      modal.className = 'keyboard-help-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', t('keyboard.ariaLabel'));

      modal.innerHTML = `
        <div class="keyboard-help-content">
          <div class="keyboard-help-header">
            <span class="keyboard-help-title">${t('keyboard.title')}</span>
            <button type="button" class="update-banner-close" aria-label="${t('info.close')}" id="keyboard-help-close">×</button>
          </div>
          <table class="keyboard-help-table">
            <tbody>
              <tr><td><kbd>/</kbd> ${t('keyboard.or')} <kbd>.</kbd></td><td>${t('keyboard.focusSearch')}</td></tr>
              <tr><td><kbd>Ctrl+K</kbd></td><td>${t('keyboard.focusSearch')}</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>${t('keyboard.clearSearch')}</td></tr>
              <tr><td><kbd>Enter</kbd></td><td>${t('keyboard.firstResult')}</td></tr>
              <tr><td><kbd>←</kbd> / <kbd>→</kbd></td><td>${t('keyboard.prevNext')}</td></tr>
              <tr><td><kbd>?</kbd></td><td>${t('keyboard.help')}</td></tr>
            </tbody>
          </table>
        </div>`;

      document.body.appendChild(modal);
      modal.querySelector('#keyboard-help-close')?.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
      });
      return;
    }

    // ← / → — kategori navigasyonu
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      const navBtns = Array.from(document.querySelectorAll('.category-nav button'));
      if (!navBtns.length) return;
      const activeIdx = navBtns.findIndex(b => b.classList.contains('active'));
      const step = ev.key === 'ArrowRight' ? 1 : -1;
      const next = navBtns[activeIdx + step];
      if (next) {
        ev.preventDefault();
        next.click();
      }
    }
  });
  // Offline/online status banner
  (() => {
    let offlineBanner = null;

    const showOfflineBanner = () => {
      if (offlineBanner) return;
      offlineBanner = document.createElement('div');
      offlineBanner.id = 'offline-banner';
      offlineBanner.className = 'offline-banner';
      offlineBanner.setAttribute('role', 'status');
      offlineBanner.setAttribute('aria-live', 'polite');

      const icon = document.createElement('span');
      icon.className = 'offline-banner-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '📡';

      const msg = document.createElement('span');
      msg.className = 'offline-banner-text';
      msg.textContent = t('offline.message');

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'update-banner-close';
      close.setAttribute('aria-label', t('info.close'));
      close.innerHTML = '×';
      close.addEventListener('click', () => {
        try {
          offlineBanner.remove();
          offlineBanner = null;
        } catch {}
      });

      offlineBanner.appendChild(icon);
      offlineBanner.appendChild(msg);
      offlineBanner.appendChild(close);
      document.body.appendChild(offlineBanner);
    };

    const hideOfflineBanner = () => {
      if (!offlineBanner) return;
      try {
        offlineBanner.remove();
      } catch {}
      offlineBanner = null;
    };

    window.addEventListener('offline', showOfflineBanner);
    window.addEventListener('online', hideOfflineBanner);

    if (!navigator.onLine) showOfflineBanner();
  })();

  // Listen for data updates from service worker (stale-while-revalidate)
  if (navigator.serviceWorker) {
    let dataUpdateBannerShown = false;
    navigator.serviceWorker.addEventListener('message', ev => {
      try {
        if (ev.data?.type === 'DATA_UPDATED' && !dataUpdateBannerShown) {
          dataUpdateBannerShown = true;
          let bar = document.getElementById('data-update-banner');
          if (!bar) {
            bar = document.createElement('div');
            bar.id = 'data-update-banner';
            bar.className = 'update-banner';
            bar.setAttribute('role', 'status');
            bar.setAttribute('aria-live', 'polite');

            const msg = document.createElement('span');
            msg.className = 'update-banner-text';
            msg.textContent = t('update.dataChanged');

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'update-banner-action';
            btn.textContent = t('update.refresh');
            btn.setAttribute('aria-label', t('update.refreshAria'));
            btn.addEventListener('click', () => window.location.reload());

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'update-banner-close';
            close.setAttribute('aria-label', t('info.close'));
            close.innerHTML = '\u00d7';
            close.addEventListener('click', () => {
              try {
                bar.remove();
              } catch {}
            });

            bar.appendChild(msg);
            bar.appendChild(btn);
            bar.appendChild(close);
            document.body.appendChild(bar);
          }
        }
      } catch {}
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      let hadController = !!navigator.serviceWorker.controller;
      let bannerShown = false;
      let lastReg = null;

      const showUpdateBanner = () => {
        if (bannerShown) return;
        bannerShown = true;
        try {
          let bar = document.getElementById('sw-update-banner');
          if (!bar) {
            bar = document.createElement('div');
            bar.id = 'sw-update-banner';
            bar.className = 'update-banner';
            bar.setAttribute('role', 'status');
            bar.setAttribute('aria-live', 'polite');

            const msg = document.createElement('span');
            msg.className = 'update-banner-text';
            msg.textContent = t('update.available');

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'update-banner-action';
            btn.textContent = t('update.refresh');
            btn.setAttribute('aria-label', t('update.refreshAria'));
            btn.addEventListener('click', () => {
              try {
                if (lastReg && lastReg.waiting) {
                  lastReg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
              } catch {}
              window.location.reload();
            });

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'update-banner-close';
            close.setAttribute('aria-label', t('info.close'));
            close.innerHTML = '×';
            close.addEventListener('click', () => {
              try {
                bar.remove();
              } catch {}
            });

            bar.appendChild(msg);
            bar.appendChild(btn);
            bar.appendChild(close);
            document.body.appendChild(bar);
          } else {
            bar.style.display = '';
          }
        } catch {}
      };

      navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then(
        reg => {
          lastReg = reg;
          logger.info('sw', 'ServiceWorker registration successful with scope: ' + reg.scope);
          try {
            setInterval(
              () => {
                reg.update().catch(() => {});
              },
              60 * 60 * 1000
            );
          } catch {}
          try {
            if ('periodicSync' in reg) {
              reg.periodicSync
                .register('update-content', {
                  minInterval: 24 * 60 * 60 * 1000
                })
                .catch(() => {});
            }
          } catch {}
          try {
            // If a new worker is found and installed while a controller exists, show banner
            reg.addEventListener('updatefound', () => {
              const inst = reg.installing;
              if (!inst) return;
              inst.addEventListener('statechange', () => {
                if (
                  inst.state === 'installed' &&
                  navigator.serviceWorker.controller &&
                  hadController
                ) {
                  showUpdateBanner();
                }
              });
            });
            // Also, if there is already a waiting worker (rare with skipWaiting), show banner
            if (reg.waiting && navigator.serviceWorker.controller && hadController) {
              showUpdateBanner();
            }
          } catch {}
        },
        err => logger.error('sw', 'ServiceWorker registration failed', err)
      );

      // When a new SW takes control, offer refresh instead of auto-reload
      try {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!hadController) {
            hadController = true;
            return;
          }
          showUpdateBanner();
        });
      } catch {}
    });
  }
});

// PWA install UI imported from ./lib/pwa-install.js

// Test exports (tree-shaken in production builds)
export { createLinkItem as _createLinkItem };
export { createCategoryCard as _createCategoryCard };
export { renderCategoryContent as _renderCategoryContent };

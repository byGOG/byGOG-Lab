/**
 * Lazy Category Loader
 * Extracted from renderLinks.js to keep it focused on orchestration.
 *
 * Handles:
 * - Rendering placeholder shells for all categories upfront
 * - Loading category data on-demand via IntersectionObserver
 * - Pre-loading favorites' categories immediately
 *
 * Usage:
 *   import { initLazyCategories } from './lazy-loader.js';
 *   const lazyState = initLazyCategories(indexData, container, {
 *     createCategoryCard,
 *     renderCategoryContent,
 *     getCachedData,
 *     setCachedCategory,
 *     getFavorites,
 *     onCategoryLoaded,
 *   });
 */

/**
 * @param {object} indexData
 * @param {HTMLElement} container
 * @param {object} deps
 * @param {Function} deps.createCategoryCard
 * @param {Function} deps.renderCategoryContent
 * @param {Function} deps.getCachedCategories - Returns the mutable categories array in cachedData
 * @param {Function} deps.getFavorites - Returns the current favorites Set
 * @param {Function} deps.onCategoryLoaded - Called after each category finishes loading
 */
export function initLazyCategories(indexData, container, deps) {
  const {
    createCategoryCard,
    renderCategoryContent,
    getCachedCategories,
    getFavorites,
    onCategoryLoaded
  } = deps;

  const cachedCategories = getCachedCategories();

  // Render placeholder shells synchronously
  const frag = document.createDocumentFragment();
  const entries = (indexData.categories || []).map((meta, index) => {
    const title = meta?.title || '';
    const card = createCategoryCard(title);
    card.dataset.categoryIndex = String(index);
    if (meta?.file) card.dataset.categoryFile = String(meta.file);
    const loading = document.createElement('div');
    loading.className = 'category-loading';
    loading.textContent = 'Yukleniyor...';
    card.appendChild(loading);
    frag.appendChild(card);
    cachedCategories.push({ title });
    return { meta, card, index, loaded: false, loading: false, promise: null };
  });
  container.appendChild(frag);

  const state = { entries };

  const entryByFile = new Map();
  entries.forEach(entry => {
    if (entry.meta?.file) entryByFile.set(entry.meta.file, entry);
  });
  state.entryByFile = entryByFile;

  const showLoadError = card => {
    if (!card) return;
    let msg = card.querySelector('.category-loading');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'category-loading';
      card.appendChild(msg);
    }
    msg.textContent = 'Yuklenemedi.';
  };

  const loadCategory = async entry => {
    if (!entry || entry.loaded || entry.loading) return entry?.promise;
    entry.loading = true;
    entry.promise = (async () => {
      try {
        const res = await fetch(entry.meta.file, { cache: 'force-cache' });
        if (!res.ok) throw new Error('Category load failed');
        const data = await res.json();
        renderCategoryContent(data, entry.card);
        entry.loaded = true;
        cachedCategories[entry.index] = data;
        if (onCategoryLoaded) onCategoryLoaded();
        return data;
      } catch {
        showLoadError(entry.card);
        return null;
      } finally {
        entry.loading = false;
      }
    })();
    return entry.promise;
  };

  state.loadCategory = loadCategory;
  state.loadAllPromise = null;
  state.loadAll = async () => {
    if (state.loadAllPromise) return state.loadAllPromise;
    state.loadAllPromise = Promise.all(entries.map(entry => loadCategory(entry))).then(() => {
      if (onCategoryLoaded) onCategoryLoaded();
    });
    return state.loadAllPromise;
  };
  state.allLoaded = () => entries.every(entry => entry.loaded);

  // Load all categories immediately
  state.loadAll();

  return state;
}

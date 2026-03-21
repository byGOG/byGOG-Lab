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
    getFavorites: _getFavorites,
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
    // Skeleton placeholder cards
    const skeletonWrap = document.createElement('ul');
    skeletonWrap.className = 'skeleton-list';
    skeletonWrap.setAttribute('aria-hidden', 'true');
    for (let s = 0; s < 4; s++) {
      const li = document.createElement('li');
      li.className = 'skeleton-card';
      li.innerHTML =
        '<span class="skeleton-icon"></span><span class="skeleton-text"><span class="skeleton-line"></span><span class="skeleton-line"></span></span>';
      skeletonWrap.appendChild(li);
    }
    card.appendChild(skeletonWrap);
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

  const showLoadError = (card, entry) => {
    if (!card) return;
    const skel = card.querySelector('.skeleton-list');
    if (skel) skel.remove();
    let msg = card.querySelector('.category-loading');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'category-loading';
      card.appendChild(msg);
    }
    msg.innerHTML = '';
    const text = document.createElement('span');
    text.textContent = 'Kategori yüklenemedi.';
    msg.appendChild(text);
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'category-retry-btn';
    retryBtn.textContent = 'Tekrar dene';
    retryBtn.addEventListener('click', () => {
      msg.textContent = 'Yükleniyor...';
      if (entry) {
        entry.loaded = false;
        entry.loading = false;
        entry.promise = null;
        loadCategory(entry);
      }
    });
    msg.appendChild(retryBtn);
  };

  const loadCategory = async entry => {
    if (!entry || entry.loaded || entry.loading) return entry?.promise;
    entry.loading = true;
    entry.promise = (async () => {
      try {
        const res = await fetch(entry.meta.file);
        if (!res.ok) throw new Error('Category load failed');
        const data = await res.json();
        renderCategoryContent(data, entry.card);
        entry.loaded = true;
        cachedCategories[entry.index] = data;
        if (onCategoryLoaded) onCategoryLoaded();
        return data;
      } catch {
        showLoadError(entry.card, entry);
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

  // Load all categories immediately (no lazy loading)
  entries.forEach(entry => loadCategory(entry));
  state.observer = null;

  return state;
}

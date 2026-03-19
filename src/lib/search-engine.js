// @ts-check
/**
 * Search engine utilities
 */

/**
 * @typedef {Object} SearchEntry
 * @property {number} index
 * @property {string} folded
 * @property {string} [nameFolded]
 * @property {boolean} [recommended]
 * @property {string} [catSlug]
 * @property {boolean} [isLink]
 * @property {HTMLElement} [catEl]
 * @property {HTMLElement} [subEl]
 */

/**
 * @typedef {Object} HighlightMeta
 * @property {string} raw
 * @property {boolean} hasQuery
 * @property {RegExp|null} regex
 */

import { fuzzyMatch as fuzzyMatchFn } from './fuzzy.js';
import { t } from './i18n.js';

const SEARCH_LOCALE = 'tr';
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

/**
 * Normalize string for search
 * @param {string} value
 * @returns {string}
 */
export function normalizeForSearch(value) {
  return String(value || '').toLocaleLowerCase(SEARCH_LOCALE);
}

/**
 * Fold string for search (remove diacritics, normalize Turkish chars)
 * @param {string} value
 * @returns {string}
 */
export function foldForSearch(value) {
  return normalizeForSearch(value)
    .normalize('NFD')
    .replace(DIACRITIC_PATTERN, '')
    .replace(/ı/g, 'i');
}

/**
 * Tokenize folded query
 * @param {string} value
 * @returns {string[]}
 */
export function tokenizeFoldedQuery(value) {
  return foldForSearch(value).split(/\s+/).filter(Boolean);
}

/**
 * Escape special regex characters
 * @param {string} value
 * @returns {string}
 */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build highlight regex from query
 * @param {string} value
 * @returns {RegExp|null}
 */
export function buildHighlightRegex(value) {
  const tokens = normalizeForSearch(value).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  return new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
}

/**
 * Create highlight metadata object
 * @param {string} value
 * @returns {{raw: string, hasQuery: boolean, regex: RegExp|null}}
 */
export function createHighlightMeta(value) {
  const hasQuery = value.trim().length > 0;
  return {
    raw: value,
    hasQuery,
    regex: hasQuery ? buildHighlightRegex(value) : null
  };
}

/**
 * Apply or remove highlight from node
 * @param {HTMLElement} node
 * @param {RegExp|null} _regex
 */
export function applyHighlight(node, _regex) {
  const label = node.querySelector('.link-text');
  if (label) {
    const original = node.dataset.nameOriginal || label.textContent || '';
    label.textContent = original;
  }
  const tip = node.querySelector('.custom-tooltip');
  if (tip) {
    const descOriginal = node.dataset.descOriginal || '';
    if (descOriginal) {
      const img = tip.querySelector('img');
      try {
        tip.innerHTML = '';
        if (img) {
          tip.appendChild(img);
          tip.appendChild(document.createTextNode(' '));
        }
        tip.appendChild(document.createTextNode(descOriginal));
      } catch {
        tip.textContent = descOriginal;
      }
    }
  }
}

/**
 * Create match applier function for search results
 * @param {HTMLElement[]} nodes
 * @param {SearchEntry[]} dataset
 * @param {HTMLElement} status
 * @returns {(meta: HighlightMeta, matches: number[]) => void}
 */
export function createMatchApplier(nodes, dataset, status) {
  const visible = new Set(dataset.map(entry => entry.index));
  const catCounts = new Map();
  const subCounts = new Map();

  dataset.forEach(entry => {
    if (!entry.isLink) return;
    const cat = entry.catEl;
    const sub = entry.subEl;
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
    if (sub) subCounts.set(sub, (subCounts.get(sub) || 0) + 1);
  });

  /** @param {HTMLElement|undefined} el @param {Map<HTMLElement, number>} countMap */
  function toggleContainer(el, countMap) {
    if (!el) return;
    const count = countMap.get(el) || 0;
    el.classList.toggle('is-hidden', count <= 0);
  }

  /** @param {number} idx */
  function hideIndex(idx) {
    const node = nodes[idx];
    if (!node) return;
    if (!node.classList.contains('is-hidden')) {
      node.classList.add('is-hidden');
      applyHighlight(node, null);
      const entry = dataset[idx];
      if (entry.isLink) {
        const cat = entry.catEl;
        const sub = entry.subEl;
        if (cat) {
          catCounts.set(cat, (catCounts.get(cat) || 0) - 1);
          toggleContainer(cat, catCounts);
        }
        if (sub) {
          subCounts.set(sub, (subCounts.get(sub) || 0) - 1);
          toggleContainer(sub, subCounts);
        }
      }
    }
    visible.delete(idx);
  }

  /** @param {number} idx @param {RegExp|null} regex */
  function showIndex(idx, regex) {
    const node = nodes[idx];
    if (!node) return false;
    const wasHidden = node.classList.contains('is-hidden');
    if (wasHidden) {
      node.classList.remove('is-hidden');
      const entry = dataset[idx];
      if (entry.isLink) {
        const cat = entry.catEl;
        const sub = entry.subEl;
        if (cat) {
          catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
          toggleContainer(cat, catCounts);
        }
        if (sub) {
          subCounts.set(sub, (subCounts.get(sub) || 0) + 1);
          toggleContainer(sub, subCounts);
        }
      }
      visible.add(idx);
    }
    applyHighlight(node, regex);
    return dataset[idx].isLink;
  }

  return function applyMatches(meta, matches) {
    const matchSet = new Set(matches);
    /** @type {number[]} */
    const toHide = [];
    visible.forEach(idx => {
      if (!matchSet.has(idx)) toHide.push(idx);
    });
    toHide.forEach(hideIndex);

    let matchCount = 0;
    matchSet.forEach(idx => {
      if (showIndex(idx, meta.regex)) matchCount++;
    });

    if (meta.hasQuery) {
      const noResults = matchCount === 0;
      status.innerHTML = '';
      status.toggleAttribute('data-no-results', noResults);
      if (noResults) {
        const msg = document.createElement('span');
        msg.className = 'no-results-msg';
        msg.textContent = t('search.noResults');
        status.appendChild(msg);
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'no-results-clear';
        clearBtn.textContent = t('keyboard.clearSearch');
        clearBtn.addEventListener('click', () => {
          const input = /** @type {HTMLInputElement|null} */ (
            document.getElementById('search-input')
          );
          if (input) {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
          }
        });
        status.appendChild(clearBtn);
      } else {
        status.textContent = t('search.results', { count: matchCount });
      }
    } else {
      status.innerHTML = '';
      status.removeAttribute('data-no-results');
    }
  };
}

/**
 * Create Web Worker search engine
 * @param {HTMLElement[]} nodes
 * @param {SearchEntry[]} dataset
 * @param {HTMLElement} status
 * @returns {{run: (query: string, scope: string) => void, dispose: () => void}|null}
 */
export function createWorkerSearchEngine(nodes, dataset, status) {
  if (typeof window === 'undefined' || typeof window.Worker === 'undefined') return null;
  let worker;
  try {
    worker = new Worker(new URL('../searchWorker.js', import.meta.url), { type: 'module' });
  } catch (err) {
    console.warn('Search worker could not start:', err);
    return null;
  }
  const applyMatches = createMatchApplier(nodes, dataset, status);
  const pending = new Map();
  let lastQueryId = 0;
  let latestApplied = 0;

  worker.postMessage({
    type: 'seed',
    payload: dataset.map(entry => ({
      index: entry.index,
      folded: entry.folded,
      nameFolded: entry.nameFolded || '',
      recommended: !!entry.recommended,
      catSlug: entry.catSlug || ''
    }))
  });

  worker.addEventListener('message', event => {
    const { type, payload } = event.data || {};
    if (type !== 'result' || !payload) return;
    const { id, matches } = payload;
    const meta = pending.get(id);
    pending.delete(id);
    if (!meta || id < latestApplied) return;
    latestApplied = id;
    applyMatches(meta, matches || []);
  });

  let _scope = '';
  return {
    run(query, scope) {
      _scope = scope || '';
      const meta = createHighlightMeta(query);
      const tokens = tokenizeFoldedQuery(query);
      if (!tokens.length) {
        // No query → show all items; scope only filters when there is an active query
        applyMatches(
          meta,
          dataset.map(entry => entry.index)
        );
        return;
      }
      const id = ++lastQueryId;
      pending.set(id, meta);
      worker.postMessage({ type: 'query', payload: { id, value: query, scope: _scope } });
    },
    dispose() {
      try {
        worker.terminate();
      } catch {}
    }
  };
}

/**
 * Score a search result for ranking
 * Higher score = better match
 * @param {SearchEntry} entry
 * @param {string[]} tokens
 * @returns {number}
 */
function scoreEntry(entry, tokens) {
  let score = 0;
  const name = entry.nameFolded || '';
  // Name match bonus (+10 per token found in name)
  if (name) {
    for (const t of tokens) {
      if (name.includes(t)) score += 10;
    }
  }
  // Recommended bonus
  if (entry.recommended) score += 5;
  return score;
}

/**
 * Create synchronous search engine (fallback)
 * @param {HTMLElement[]} nodes
 * @param {SearchEntry[]} dataset
 * @param {HTMLElement} status
 * @returns {{run: (query: string, scope: string) => void, dispose: () => void}}
 */
export function createSyncSearchEngine(nodes, dataset, status) {
  const applyMatches = createMatchApplier(nodes, dataset, status);
  return {
    run(query, scope) {
      const meta = createHighlightMeta(query);
      const tokens = tokenizeFoldedQuery(query);
      const pool = scope ? dataset.filter(e => e.catSlug === scope) : dataset;
      if (!tokens.length) {
        // No query → show all items; scope only filters when there is an active query
        applyMatches(
          meta,
          dataset.map(entry => entry.index)
        );
        return;
      }

      const exact = [];
      const fuzzy = [];

      for (const entry of pool) {
        const allExact = tokens.every(t => entry.folded.includes(t));
        if (allExact) {
          exact.push(entry);
        } else {
          const allFuzzy = tokens.every(
            t => entry.folded.includes(t) || fuzzyMatchFn(t, entry.folded)
          );
          if (allFuzzy) fuzzy.push(entry);
        }
      }

      // Sort each group by score (name match + recommended)
      /** @type {(a: SearchEntry, b: SearchEntry) => number} */
      const cmp = (a, b) => scoreEntry(b, tokens) - scoreEntry(a, tokens);
      exact.sort(cmp);
      fuzzy.sort(cmp);

      applyMatches(meta, [...exact.map(e => e.index), ...fuzzy.map(e => e.index)]);
    },
    dispose() {}
  };
}

export { SEARCH_LOCALE, DIACRITIC_PATTERN };

/**
 * Search engine utilities
 */

import { fuzzyMatch as fuzzyMatchFn } from './fuzzy.js';
import { t } from './i18n.js';

export interface SearchEntry {
  index: number;
  folded: string;
  nameFolded?: string;
  recommended?: boolean;
  catSlug?: string;
  isLink?: boolean;
  catEl?: HTMLElement;
  subEl?: HTMLElement;
}

export interface HighlightMeta {
  raw: string;
  hasQuery: boolean;
  regex: RegExp | null;
}

const SEARCH_LOCALE = 'tr';
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

export function normalizeForSearch(value: string): string {
  return String(value || '').toLocaleLowerCase(SEARCH_LOCALE);
}

export function foldForSearch(value: string): string {
  return normalizeForSearch(value)
    .normalize('NFD')
    .replace(DIACRITIC_PATTERN, '')
    .replace(/ı/g, 'i');
}

export function tokenizeFoldedQuery(value: string): string[] {
  return foldForSearch(value).split(/\s+/).filter(Boolean);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildHighlightRegex(value: string): RegExp | null {
  const tokens = normalizeForSearch(value).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  return new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
}

export function createHighlightMeta(value: string): HighlightMeta {
  const hasQuery = value.trim().length > 0;
  return {
    raw: value,
    hasQuery,
    regex: hasQuery ? buildHighlightRegex(value) : null
  };
}

function highlightText(text: string, regex: RegExp): DocumentFragment {
  const frag = document.createDocumentFragment();
  let lastIndex = 0;
  const re = new RegExp(regex.source, regex.flags);
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const mark = document.createElement('mark');
    mark.textContent = match[0];
    frag.appendChild(mark);
    lastIndex = re.lastIndex;
    if (match[0].length === 0) break;
  }
  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
  return frag;
}

export function applyHighlight(node: HTMLElement, regex: RegExp | null): void {
  const label = node.querySelector('.link-text');
  if (label) {
    const original = (node as HTMLElement).dataset.nameOriginal || label.textContent || '';
    const badge = label.querySelector('.new-badge');
    if (regex) {
      label.innerHTML = '';
      label.appendChild(highlightText(original, regex));
      if (badge) label.appendChild(badge);
    } else {
      label.textContent = original;
      if (badge) label.appendChild(badge);
    }
  }
  const tip = node.querySelector('.custom-tooltip');
  if (tip) {
    const descOriginal = (node as HTMLElement).dataset.descOriginal || '';
    if (descOriginal) {
      const img = tip.querySelector('img');
      try {
        tip.innerHTML = '';
        if (img) {
          tip.appendChild(img);
          tip.appendChild(document.createTextNode(' '));
        }
        if (regex) {
          tip.appendChild(highlightText(descOriginal, regex));
        } else {
          tip.appendChild(document.createTextNode(descOriginal));
        }
      } catch {
        tip.textContent = descOriginal;
      }
    }
  }
}

export function createMatchApplier(
  nodes: HTMLElement[],
  dataset: SearchEntry[],
  status: HTMLElement
): (meta: HighlightMeta, matches: number[]) => void {
  const visible = new Set(dataset.map(entry => entry.index));
  const catCounts = new Map<HTMLElement, number>();
  const subCounts = new Map<HTMLElement, number>();

  dataset.forEach(entry => {
    if (!entry.isLink) return;
    const cat = entry.catEl;
    const sub = entry.subEl;
    if (cat) catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
    if (sub) subCounts.set(sub, (subCounts.get(sub) || 0) + 1);
  });

  function toggleContainer(el: HTMLElement | undefined, countMap: Map<HTMLElement, number>): void {
    if (!el) return;
    const count = countMap.get(el) || 0;
    el.classList.toggle('is-hidden', count <= 0);
  }

  function hideIndex(idx: number): void {
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

  function showIndex(idx: number, regex: RegExp | null): boolean {
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
    return !!dataset[idx].isLink;
  }

  return function applyMatches(meta: HighlightMeta, matches: number[]): void {
    const matchSet = new Set(matches);
    const toHide: number[] = [];
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
          const input = document.getElementById('search-input') as HTMLInputElement | null;
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

export function createWorkerSearchEngine(
  nodes: HTMLElement[],
  dataset: SearchEntry[],
  status: HTMLElement
): { run: (query: string, scope: string) => void; dispose: () => void } | null {
  if (typeof window === 'undefined' || typeof window.Worker === 'undefined') return null;
  let worker: Worker;
  try {
    worker = new Worker(new URL('../searchWorker.js', import.meta.url), { type: 'module' });
  } catch (err) {
    console.warn('Search worker could not start:', err);
    return null;
  }
  const applyMatches = createMatchApplier(nodes, dataset, status);
  const pending = new Map<number, HighlightMeta>();
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
    run(query: string, scope: string) {
      _scope = scope || '';
      const meta = createHighlightMeta(query);
      const tokens = tokenizeFoldedQuery(query);
      if (!tokens.length) {
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

function scoreEntry(entry: SearchEntry, tokens: string[]): number {
  let score = 0;
  const name = entry.nameFolded || '';
  if (name) {
    for (const tok of tokens) {
      if (name.includes(tok)) score += 10;
    }
  }
  if (entry.recommended) score += 5;
  return score;
}

export function createSyncSearchEngine(
  nodes: HTMLElement[],
  dataset: SearchEntry[],
  status: HTMLElement
): { run: (query: string, scope: string) => void; dispose: () => void } {
  const applyMatches = createMatchApplier(nodes, dataset, status);
  return {
    run(query: string, scope: string) {
      const meta = createHighlightMeta(query);
      const tokens = tokenizeFoldedQuery(query);
      const pool = scope ? dataset.filter(e => e.catSlug === scope) : dataset;
      if (!tokens.length) {
        applyMatches(
          meta,
          dataset.map(entry => entry.index)
        );
        return;
      }

      const exact: SearchEntry[] = [];
      const fuzzy: SearchEntry[] = [];

      for (const entry of pool) {
        const allExact = tokens.every(tok => entry.folded.includes(tok));
        if (allExact) {
          exact.push(entry);
        } else {
          const allFuzzy = tokens.every(
            tok => entry.folded.includes(tok) || fuzzyMatchFn(tok, entry.folded)
          );
          if (allFuzzy) fuzzy.push(entry);
        }
      }

      const cmp = (a: SearchEntry, b: SearchEntry): number => scoreEntry(b, tokens) - scoreEntry(a, tokens);
      exact.sort(cmp);
      fuzzy.sort(cmp);

      applyMatches(meta, [...exact.map(e => e.index), ...fuzzy.map(e => e.index)]);
    },
    dispose() {}
  };
}

export { SEARCH_LOCALE, DIACRITIC_PATTERN };

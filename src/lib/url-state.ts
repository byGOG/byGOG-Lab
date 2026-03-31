/**
 * URL State management for shareable links.
 * Encodes filter/search/tag/category state in URL query parameters.
 */

export interface UrlState {
  q?: string;
  filter?: string;
  tag?: string[];
  cat?: string;
}

export function readUrlState(): UrlState {
  try {
    const params = new URL(window.location.href).searchParams;
    const state: UrlState = {};
    const q = params.get('q');
    if (q) state.q = q;
    const filter = params.get('filter');
    if (filter) state.filter = filter;
    const tag = params.get('tag');
    if (tag) state.tag = tag.split(',').filter(Boolean);
    const cat = params.get('cat');
    if (cat) state.cat = cat;
    return state;
  } catch {
    return {};
  }
}

export function writeUrlState(partial: Partial<UrlState>): void {
  try {
    const url = new URL(window.location.href);
    if ('q' in partial) {
      if (partial.q) url.searchParams.set('q', partial.q);
      else url.searchParams.delete('q');
    }
    if ('filter' in partial) {
      if (partial.filter && partial.filter !== 'all') {
        url.searchParams.set('filter', partial.filter);
      } else {
        url.searchParams.delete('filter');
      }
    }
    if ('tag' in partial) {
      if (Array.isArray(partial.tag) && partial.tag.length) {
        url.searchParams.set('tag', partial.tag.join(','));
      } else {
        url.searchParams.delete('tag');
      }
    }
    if ('cat' in partial) {
      if (partial.cat) url.searchParams.set('cat', partial.cat);
      else url.searchParams.delete('cat');
    }
    history.replaceState(null, '', url.toString());
  } catch { /* URL güncellenemedi */ }
}

export function clearUrlState(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('filter');
    url.searchParams.delete('tag');
    url.searchParams.delete('cat');
    history.replaceState(null, '', url.toString());
  } catch { /* URL güncellenemedi */ }
}

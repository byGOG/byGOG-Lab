const SEARCH_LOCALE = 'tr';
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

let entries = [];

function normalizeForSearch(value) {
  return String(value || '').toLocaleLowerCase(SEARCH_LOCALE);
}

function foldForSearch(value) {
  return normalizeForSearch(value)
    .normalize('NFD')
    .replace(DIACRITIC_PATTERN, '')
    .replace(/ı/g, 'i');
}

// Inline fuzzy matching (cannot use ES module imports in workers across all browsers)
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const bLen = b.length;
  let prev = Array.from({ length: bLen + 1 }, (_, i) => i);
  let curr = new Array(bLen + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bLen];
}

function fuzzyMatch(token, text) {
  const max = token.length < 3 ? 0 : token.length <= 5 ? 1 : 2;
  if (max === 0) return false;

  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    if (Math.abs(token.length - word.length) > max) continue;
    if (levenshtein(token, word) <= max) return true;
    if (word.length > token.length) {
      const prefix = word.slice(0, token.length + 1);
      if (levenshtein(token, prefix) <= max) return true;
    }
  }
  return false;
}

self.addEventListener('message', event => {
  const data = event.data || {};
  const { type, payload } = data;
  if (type === 'seed') {
    if (Array.isArray(payload)) {
      entries = payload.map(item => ({
        index: item.index,
        folded: typeof item.folded === 'string' ? item.folded : foldForSearch(item.text || ''),
        nameFolded: item.nameFolded || '',
        recommended: !!item.recommended,
        catSlug: item.catSlug || ''
      }));
    } else {
      entries = [];
    }
    return;
  }
  if (type === 'query') {
    if (!payload) return;
    const id = payload.id;
    const value = payload.value || '';
    const scope = payload.scope || '';
    const tokens = foldForSearch(value).split(/\s+/).filter(Boolean);
    const pool = scope ? entries.filter(e => e.catSlug === scope) : entries;
    let matches;
    if (!tokens.length) {
      // No query → return all items; scope only filters when there is an active query
      matches = entries.map(entry => entry.index);
    } else {
      const exact = [];
      const fuzzy = [];
      for (const entry of pool) {
        const allExact = tokens.every(t => entry.folded.includes(t));
        if (allExact) {
          exact.push(entry);
        } else {
          const allFuzzy = tokens.every(
            t => entry.folded.includes(t) || fuzzyMatch(t, entry.folded)
          );
          if (allFuzzy) fuzzy.push(entry);
        }
      }
      // Score and sort: name match (+10), recommended (+5)
      const scoreEntry = e => {
        let s = 0;
        if (e.nameFolded) {
          for (const t of tokens) {
            if (e.nameFolded.includes(t)) s += 10;
          }
        }
        if (e.recommended) s += 5;
        return s;
      };
      const cmp = (a, b) => scoreEntry(b) - scoreEntry(a);
      exact.sort(cmp);
      fuzzy.sort(cmp);
      matches = [...exact.map(e => e.index), ...fuzzy.map(e => e.index)];
    }
    self.postMessage({ type: 'result', payload: { id, matches } });
  }
});

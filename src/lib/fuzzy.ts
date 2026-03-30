/**
 * Fuzzy matching utilities for search
 * Provides Levenshtein distance and fuzzy token matching
 */

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const bLen = b.length;
  let prev = Array.from({ length: bLen + 1 }, (_, i) => i);
  let curr = new Array<number>(bLen + 1);

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

export function maxDistance(token: string): number {
  if (token.length < 3) return 0;
  if (token.length <= 5) return 1;
  return 2;
}

export function fuzzyMatch(token: string, text: string): boolean {
  const max = maxDistance(token);
  if (max === 0) return false;

  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    if (Math.abs(token.length - word.length) > max) continue;
    if (levenshtein(token, word) <= max) return true;
    // Check fuzzy prefix match for longer words
    if (word.length > token.length) {
      const prefix = word.slice(0, token.length + 1);
      if (levenshtein(token, prefix) <= max) return true;
    }
  }
  return false;
}

// @ts-check
/**
 * Fuzzy matching utilities for search
 * Provides Levenshtein distance and fuzzy token matching
 */

/**
 * Compute Levenshtein distance between two strings (single-row optimized)
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
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

/**
 * Determine max edit distance based on token length
 * @param {string} token
 * @returns {number}
 */
export function maxDistance(token) {
  if (token.length < 3) return 0;
  if (token.length <= 5) return 1;
  return 2;
}

/**
 * Check if a token fuzzy-matches any word in the text
 * @param {string} token - search token (already folded)
 * @param {string} text - folded text to search in
 * @returns {boolean}
 */
export function fuzzyMatch(token, text) {
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

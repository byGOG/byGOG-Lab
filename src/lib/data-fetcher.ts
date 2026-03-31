/**
 * Data fetching utilities for links
 */

import type { LinksIndex, LinksData } from '../types.js';

const LINKS_INDEX_PATH = 'data/links-index.json';
const LINKS_FALLBACK_PATH = 'links.json';

/**
 * Check if data is a links index format
 */
export function isLinksIndex(data: unknown): data is LinksIndex {
  return !!(
    data &&
    Array.isArray((data as LinksIndex).categories) &&
    (data as LinksIndex).categories.every(cat => typeof cat?.file === 'string')
  );
}

/**
 * Fetch links from legacy single file
 */
export async function fetchLinksLegacy(): Promise<LinksData> {
  const res = await fetch(LINKS_FALLBACK_PATH);
  if (!res.ok) throw new Error('links.json yüklenemedi');
  return res.json();
}

/**
 * Fetch links - tries index first, falls back to legacy
 */
export async function fetchLinks(): Promise<{ mode: 'index' | 'full'; data: LinksIndex | LinksData }> {
  try {
    const res = await fetch(LINKS_INDEX_PATH);
    if (res.ok) {
      const data = await res.json();
      if (isLinksIndex(data)) return { mode: 'index', data };
      return { mode: 'full', data };
    }
  } catch {}
  return { mode: 'full', data: await fetchLinksLegacy() };
}

export { LINKS_INDEX_PATH, LINKS_FALLBACK_PATH };

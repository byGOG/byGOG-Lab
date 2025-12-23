/**
 * Data fetching utilities for links
 */

const LINKS_INDEX_PATH = "data/links-index.json";
const LINKS_FALLBACK_PATH = "links.json";

/**
 * Check if data is a links index format
 * @param {unknown} data
 * @returns {boolean}
 */
export function isLinksIndex(data) {
  return !!(data && Array.isArray(data.categories) && data.categories.every(cat => typeof cat?.file === "string"));
}

/**
 * Fetch links from legacy single file
 * @returns {Promise<object>}
 */
export async function fetchLinksLegacy() {
  const res = await fetch(LINKS_FALLBACK_PATH);
  if (!res.ok) throw new Error("links.json yüklenemedi");
  return res.json();
}

/**
 * Fetch links - tries index first, falls back to legacy
 * @returns {Promise<{mode: 'index' | 'full', data: object}>}
 */
export async function fetchLinks() {
  try {
    const res = await fetch(LINKS_INDEX_PATH, { cache: "force-cache" });
    if (res.ok) {
      const data = await res.json();
      if (isLinksIndex(data)) return { mode: "index", data };
      return { mode: "full", data };
    }
  } catch { }
  return { mode: "full", data: await fetchLinksLegacy() };
}

export { LINKS_INDEX_PATH, LINKS_FALLBACK_PATH };

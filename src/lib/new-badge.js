/**
 * "Yeni" badge system
 * Tracks which links the user has seen. New links get a "Yeni" badge.
 * Uses localStorage to persist a set of known link names.
 */

const STORAGE_KEY = 'bygog_known_links';

/** @type {Set<string>|null} */
let knownLinks = null;
let isFirstVisit = false;

function loadKnown() {
  if (knownLinks) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      knownLinks = new Set(JSON.parse(raw));
    } else {
      knownLinks = new Set();
      isFirstVisit = true;
    }
  } catch {
    knownLinks = new Set();
    isFirstVisit = true;
  }
}

/**
 * Check if a link name is new (not seen before).
 * On first visit, nothing is "new" — we populate the known set silently.
 * @param {string} name
 * @returns {boolean}
 */
export function isNewLink(name) {
  loadKnown();
  if (isFirstVisit) return false;
  return !knownLinks.has(name);
}

/**
 * Call after all categories are loaded to save the current set of link names.
 * This updates the known set so next visit can detect new additions.
 */
export function updateKnownLinks() {
  loadKnown();
  const allNames = [];
  document.querySelectorAll('.category-card li[data-name-original]').forEach(li => {
    const name = li.dataset.nameOriginal;
    if (name) allNames.push(name);
  });
  if (!allNames.length) return;
  allNames.forEach(n => knownLinks.add(n));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...knownLinks]));
  } catch {}
  isFirstVisit = false;
}

/**
 * "Yeni" badge system
 * Tracks which links the user has seen. New links get a "Yeni" badge.
 * Uses localStorage to persist a set of known link names.
 */

const STORAGE_KEY = 'bygog_known_links';

let knownLinks: Set<string> | null = null;
let isFirstVisit = false;

function loadKnown(): void {
  if (knownLinks) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      knownLinks = new Set(JSON.parse(raw) as string[]);
    } else {
      knownLinks = new Set();
      isFirstVisit = true;
    }
  } catch {
    knownLinks = new Set();
    isFirstVisit = true;
  }
}

export function isNewLink(name: string): boolean {
  loadKnown();
  if (isFirstVisit) return false;
  return !knownLinks!.has(name);
}

export function updateKnownLinks(): void {
  loadKnown();
  const allNames: string[] = [];
  document.querySelectorAll<HTMLElement>('.category-card li[data-name-original]').forEach(li => {
    const name = li.dataset.nameOriginal;
    if (name) allNames.push(name);
  });
  if (!allNames.length) return;
  allNames.forEach(n => knownLinks!.add(n));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...knownLinks!]));
  } catch { /* localStorage erişilemez */ }
  isFirstVisit = false;
}

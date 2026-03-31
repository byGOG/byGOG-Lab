/**
 * Navigation utility functions extracted for testability
 */

const DIACRITIC_RE = /[\u0300-\u036f]/g;

export function slugify(value: string): string {
  const base = String(value || '')
    .trim()
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(DIACRITIC_RE, '')
    .replace(/ı/g, 'i')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'kategori';
}

export const categoryIcons: Record<string, string> = {
  favorilerim:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z"/></svg>',
  'sistem/ofis':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'sistem araçları & bakım':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  oyun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>'
};

const DEFAULT_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';

export function getCategoryNavIcon(title: string): string {
  const key = title.toLowerCase().trim();
  for (const [k, v] of Object.entries(categoryIcons)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return DEFAULT_ICON;
}

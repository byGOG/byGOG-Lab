/**
 * Arama yardımcı fonksiyonları
 */

import type { HighlightMeta } from '../types.js';

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

export default {
  normalizeForSearch,
  foldForSearch,
  tokenizeFoldedQuery,
  escapeRegExp,
  buildHighlightRegex,
  createHighlightMeta
};

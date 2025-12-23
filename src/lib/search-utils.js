/**
 * Arama yardımcı fonksiyonları
 */

const SEARCH_LOCALE = "tr";
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

/**
 * Metni arama için normalleştirir (küçük harf)
 */
export function normalizeForSearch(value) {
  return String(value || "").toLocaleLowerCase(SEARCH_LOCALE);
}

/**
 * Türkçe karakterleri ve diyakritik işaretleri kaldırır
 */
export function foldForSearch(value) {
  return normalizeForSearch(value)
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .replace(/ı/g, "i");
}

/**
 * Sorguyu token'lara ayırır
 */
export function tokenizeFoldedQuery(value) {
  return foldForSearch(value).split(/\s+/).filter(Boolean);
}

/**
 * Regex özel karakterlerini escape eder
 */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight için regex oluşturur
 */
export function buildHighlightRegex(value) {
  const tokens = normalizeForSearch(value).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  return new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
}

/**
 * Highlight meta objesi oluşturur
 */
export function createHighlightMeta(value) {
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

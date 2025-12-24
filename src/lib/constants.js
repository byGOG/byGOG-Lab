/**
 * Sabitler ve yapılandırma
 */

// Veri dosya yolları
export const LINKS_INDEX_PATH = "data/links-index.json";
export const LINKS_FALLBACK_PATH = "links.json";

// LocalStorage anahtarları
export const STORAGE_KEYS = {
  FAVORITES: "bygog_favs",
  THEME: "theme",
  ERRORS: "bygog_errors",
  PWA_DISMISS: "pwaDismissUntil"
};

// PWA yapılandırması
export const PWA_CONFIG = {
  delayMs: 4500,
  minScroll: 200,
  snoozeDays: 7
};

// Winutil özel komutu
export const WINUTIL_COMMAND = 'irm "https://christitus.com/win" | iex';

// 3 kolon gösterilecek kategoriler
export const THREE_COL_TITLES = new Set([
  "sistem/ofis",
  "sistem araclari & bakim",
  "guvenlik & gizlilik",
  "yazilim & paket yoneticileri"
]);

// Arama gecikme süreleri (ms)
export const SEARCH_DELAYS = {
  SHORT_QUERY: 250,  // < 4 karakter
  MEDIUM_QUERY: 120, // 4-7 karakter
  LONG_QUERY: 80     // >= 8 karakter
};

// Varsayılan favoriler
export const DEFAULT_FAVORITES = [
  "Microsoft Activation Scripts",
  "Office Tool Plus",
  "Snappy Driver Installer",
  "Ninite",
  "Winutil",
  "PowerShell",
  "FMHY",
  "Privacy Guides"
];

export default {
  LINKS_INDEX_PATH,
  LINKS_FALLBACK_PATH,
  STORAGE_KEYS,
  PWA_CONFIG,
  WINUTIL_COMMAND,
  THREE_COL_TITLES,
  SEARCH_DELAYS,
  DEFAULT_FAVORITES
};

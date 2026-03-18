/**
 * Internationalization (i18n) module
 * Supports Turkish (tr) and English (en)
 */

const STORAGE_KEY = 'bygog_lang';
const DEFAULT_LANG = 'tr';
const SUPPORTED_LANGS = ['tr', 'en'];

const translations = {
  tr: {
    // Search
    'search.placeholder': 'Ara...',
    'search.results': '{count} sonuç bulundu',
    'search.noResults': 'Sonuç bulunamadı',
    'search.loading': 'Sonuçlar yükleniyor...',

    // Favorites
    'favorites.title': 'Favorilerim',
    'favorites.add': 'Favorilere Ekle',
    'favorites.remove': 'Favorilerden Çıkar',
    'favorites.toggle': 'Favorilere Ekle/Çıkar',

    // Copy
    'copy.default': 'Komutu kopyala',
    'copy.success': 'Komut kopyalandı',
    'copy.error': 'Komut kopyalanamadı',
    'copy.loading': 'Komut kopyalanıyor',
    'copy.tooltip': 'Komutu panoya kopyala',
    'copy.ariaLabel': '{name} komutunu kopyala',

    // Info
    'info.button': 'Bilgi',
    'info.official': 'Resmi kaynak',
    'info.show': 'Bilgiyi göster',
    'info.close': 'Kapat',

    // PWA
    'pwa.install': "byGOG'u yükle",
    'pwa.installSub': 'Hızlı erişim için ana ekrana ekle',
    'pwa.iosHint': 'Safari: Paylaş menüsü → Ana Ekrana Ekle',
    'pwa.androidHint': 'Chrome menüsü → Ana ekrana ekle',
    'pwa.browserHint': 'Tarayıcı menüsü → Ana ekrana ekle',
    'pwa.manualHint':
      'Uygulamayı ana ekrana eklemek için tarayıcınızın menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.',

    // Update
    'update.available': 'Yeni sürüm hazır',
    'update.refresh': 'Yenile',
    'update.refreshAria': 'Sayfayı yenile',
    'update.confirm': 'Yeni güncelleme mevcut! Yenilemek ister misiniz?',

    // Errors
    'error.linksLoad': 'Bağlantılar yüklenemedi.',
    'error.categoryLoad': 'Yüklenemedi.',
    'loading.category': 'Yükleniyor...',

    // Accessibility
    'a11y.skipLink': 'Ana içeriğe atla',
    'a11y.searchLabel': 'Site içi arama',
    'a11y.favoritesLabel': 'Favoriler',
    'a11y.mainContent': 'Ana içerik',
    'a11y.linkCategories': 'Link kategorileri',
    'a11y.openNewTab': '{name} — yeni sekmede aç',
    'a11y.goHome': 'Ana sayfaya dön',

    // Footer
    'footer.desc': 'Windows araçları ve yazılım kaynakları arşivi',
    'footer.copy': '© 2025 byGOG Lab. Tüm hakları saklıdır.',

    // Filters
    'filter.all': 'Tümü',
    'filter.recommended': 'Önerilen',
    'filter.hasCopy': 'Komut Var',
    'filter.quickLabel': 'Hızlı filtreler',

    // New badge
    'badge.new': 'Yeni',
    'badge.newAria': 'Yeni eklenen',

    // Recent
    'recent.title': 'Son Kullanılanlar',

    // Share
    'share.label': 'Paylaş',

    // Offline
    'offline.message': 'Çevrimdışısınız — önbellek kullanılıyor',

    // Keyboard help
    'keyboard.title': 'Klavye Kısayolları',
    'keyboard.ariaLabel': 'Klavye kısayolları',
    'keyboard.focusSearch': 'Aramaya odaklan',
    'keyboard.clearSearch': 'Aramayı temizle / kapat',
    'keyboard.firstResult': 'İlk sonuca git',
    'keyboard.prevNext': 'Önceki / sonraki kategori',
    'keyboard.help': 'Bu yardım ekranı',
    'keyboard.or': 'veya',

    // Category nav
    'nav.goToCategory': '{name} kategorisine git',
    'nav.goToSubcategory': '{name} alt kategorisine git',

    // Featured strip
    'featured.title': 'Öne Çıkan Araçlar',

    // New additions strip
    'newAdditions.title': 'Yeni Eklenenler',

    // Tag filter
    'tags.label': 'Etiketler',
    'tags.clearAll': 'Tümünü temizle',

    // Batch install
    'batch.toggle': 'Toplu Kurulum',
    'batch.selected': '{count} seçili',
    'batch.generate': 'Komutu Oluştur',
    'batch.clear': 'Temizle',
    'batch.copy': 'Kopyala',
    'batch.copied': 'Kopyalandı!',
    'batch.title': 'Toplu Kurulum Komutu',
    'batch.empty': 'Komut içeren araçları seçin',

    // Post-install
    'postInstall.title': 'Kurulum Sonrası',

    // Similar tools
    'similar.title': 'Benzer Araçlar',

    // Category scope
    'scope.clear': 'Kategori filtresini kaldır',
    'scope.label': 'Kategoride ara: {name}'
  },

  en: {
    // Search
    'search.placeholder': 'Search by name or content...',
    'search.results': '{count} results found',
    'search.noResults': 'No results found',
    'search.loading': 'Loading results...',

    // Favorites
    'favorites.title': 'My Favorites',
    'favorites.add': 'Add to Favorites',
    'favorites.remove': 'Remove from Favorites',
    'favorites.toggle': 'Add/Remove from Favorites',

    // Copy
    'copy.default': 'Copy command',
    'copy.success': 'Command copied',
    'copy.error': 'Failed to copy',
    'copy.loading': 'Copying...',
    'copy.tooltip': 'Copy command to clipboard',
    'copy.ariaLabel': 'Copy {name} command',

    // Info
    'info.button': 'Info',
    'info.official': 'Official source',
    'info.show': 'Show info',
    'info.close': 'Close',

    // PWA
    'pwa.install': 'Install byGOG',
    'pwa.installSub': 'Add to home screen for quick access',
    'pwa.iosHint': 'Safari: Share menu → Add to Home Screen',
    'pwa.androidHint': 'Chrome menu → Add to home screen',
    'pwa.browserHint': 'Browser menu → Add to home screen',
    'pwa.manualHint':
      'To add to home screen, use "Add to Home Screen" option in your browser menu.',

    // Update
    'update.available': 'New version available',
    'update.refresh': 'Refresh',
    'update.refreshAria': 'Refresh page',
    'update.confirm': 'New update available! Do you want to refresh?',

    // Errors
    'error.linksLoad': 'Failed to load links.',
    'error.categoryLoad': 'Failed to load.',
    'loading.category': 'Loading...',

    // Accessibility
    'a11y.skipLink': 'Skip to main content',
    'a11y.searchLabel': 'Site search',
    'a11y.favoritesLabel': 'Favorites',
    'a11y.mainContent': 'Main content',
    'a11y.linkCategories': 'Link categories',
    'a11y.openNewTab': '{name} — open in new tab',
    'a11y.goHome': 'Go to homepage',

    // Footer
    'footer.desc': 'Windows tools and software resources archive',
    'footer.copy': '© 2025 byGOG Lab. All rights reserved.',

    // Filters
    'filter.all': 'All',
    'filter.recommended': 'Recommended',
    'filter.hasCopy': 'Has Command',
    'filter.quickLabel': 'Quick filters',

    // New badge
    'badge.new': 'New',
    'badge.newAria': 'Recently added',

    // Recent
    'recent.title': 'Recently Used',

    // Share
    'share.label': 'Share',

    // Offline
    'offline.message': 'You are offline — using cache',

    // Keyboard help
    'keyboard.title': 'Keyboard Shortcuts',
    'keyboard.ariaLabel': 'Keyboard shortcuts',
    'keyboard.focusSearch': 'Focus search',
    'keyboard.clearSearch': 'Clear search / close',
    'keyboard.firstResult': 'Go to first result',
    'keyboard.prevNext': 'Previous / next category',
    'keyboard.help': 'This help screen',
    'keyboard.or': 'or',

    // Category nav
    'nav.goToCategory': 'Go to {name} category',
    'nav.goToSubcategory': 'Go to {name} subcategory',

    // Featured strip
    'featured.title': 'Featured Tools',

    // New additions strip
    'newAdditions.title': 'Recently Added',

    // Tag filter
    'tags.label': 'Tags',
    'tags.clearAll': 'Clear all',

    // Batch install
    'batch.toggle': 'Batch Install',
    'batch.selected': '{count} selected',
    'batch.generate': 'Generate Command',
    'batch.clear': 'Clear',
    'batch.copy': 'Copy',
    'batch.copied': 'Copied!',
    'batch.title': 'Batch Install Command',
    'batch.empty': 'Select tools with commands',

    // Post-install
    'postInstall.title': 'Post-Install',

    // Similar tools
    'similar.title': 'Similar Tools',

    // Category scope
    'scope.clear': 'Remove category filter',
    'scope.label': 'Search in: {name}'
  }
};

let currentLang = DEFAULT_LANG;

/**
 * Get browser language preference
 * @returns {string}
 */
function getBrowserLang() {
  try {
    const nav = navigator.language || navigator.languages?.[0] || '';
    const lang = nav.split('-')[0].toLowerCase();
    return SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/**
 * Load saved language from localStorage
 * @returns {string}
 */
function loadSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
  } catch {}
  return getBrowserLang();
}

/**
 * Initialize i18n with saved or browser language
 */
export function initI18n() {
  currentLang = loadSavedLang();
  document.documentElement.lang = currentLang;
}

/**
 * Get current language
 * @returns {string}
 */
export function getLang() {
  return currentLang;
}

/**
 * Set language
 * @param {string} lang
 */
export function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  document.documentElement.lang = lang;
}

/**
 * Toggle between languages
 * @returns {string} New language
 */
export function toggleLang() {
  const newLang = currentLang === 'tr' ? 'en' : 'tr';
  setLang(newLang);
  return newLang;
}

/**
 * Get translation for key
 * @param {string} key
 * @param {object} params - Optional interpolation params
 * @returns {string}
 */
export function t(key, params = {}) {
  const langData = translations[currentLang] || translations[DEFAULT_LANG];
  let text = langData[key] || translations[DEFAULT_LANG][key] || key;

  // Interpolate params like {count}
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });

  return text;
}

/**
 * Get all translations for current language
 * @returns {object}
 */
export function getTranslations() {
  return translations[currentLang] || translations[DEFAULT_LANG];
}

/**
 * Get supported languages
 * @returns {string[]}
 */
export function getSupportedLangs() {
  return [...SUPPORTED_LANGS];
}

/**
 * Create language toggle button
 * @returns {HTMLButtonElement}
 */
export function createLangToggle() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lang-toggle';
  btn.setAttribute('aria-label', 'Change language');

  const updateLabel = () => {
    btn.textContent = currentLang === 'tr' ? 'EN' : 'TR';
    btn.title = currentLang === 'tr' ? 'Switch to English' : "Türkçe'ye geç";
  };

  updateLabel();

  btn.addEventListener('click', () => {
    toggleLang();
    updateLabel();
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
  });

  return btn;
}

/**
 * Scan DOM for elements with data-i18n attribute and update their text.
 * Also handles data-i18n-aria for aria-label and data-i18n-title for title.
 */
export function applyI18nToDom() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = t(key);
  });
}

export { translations, SUPPORTED_LANGS, DEFAULT_LANG, STORAGE_KEY };

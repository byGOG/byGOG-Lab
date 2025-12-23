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
    'search.placeholder': 'İsim veya içerik ara...',
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
    
    // Info
    'info.button': 'Bilgi',
    'info.official': 'Resmi kaynak',
    
    // PWA
    'pwa.install': "byGOG'u yükle",
    'pwa.installSub': 'Hızlı erişim için ana ekrana ekle',
    'pwa.iosHint': 'Safari: Paylaş menüsü → Ana Ekrana Ekle',
    'pwa.androidHint': 'Chrome menüsü → Ana ekrana ekle',
    'pwa.browserHint': 'Tarayıcı menüsü → Ana ekrana ekle',
    'pwa.manualHint': 'Uygulamayı ana ekrana eklemek için tarayıcınızın menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.',
    
    // Update
    'update.available': 'Yeni sürüm hazır',
    'update.refresh': 'Yenile',
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
    
    // Footer
    'footer.desc': 'Windows araçları ve yazılım kaynakları arşivi',
    'footer.copy': '© 2025 byGOG Lab. Tüm hakları saklıdır.'
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
    
    // Info
    'info.button': 'Info',
    'info.official': 'Official source',
    
    // PWA
    'pwa.install': 'Install byGOG',
    'pwa.installSub': 'Add to home screen for quick access',
    'pwa.iosHint': 'Safari: Share menu → Add to Home Screen',
    'pwa.androidHint': 'Chrome menu → Add to home screen',
    'pwa.browserHint': 'Browser menu → Add to home screen',
    'pwa.manualHint': 'To add to home screen, use "Add to Home Screen" option in your browser menu.',
    
    // Update
    'update.available': 'New version available',
    'update.refresh': 'Refresh',
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
    
    // Footer
    'footer.desc': 'Windows tools and software resources archive',
    'footer.copy': '© 2025 byGOG Lab. All rights reserved.'
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
  } catch { }
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
  } catch { }
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
    btn.title = currentLang === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç';
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

export { translations, SUPPORTED_LANGS, DEFAULT_LANG, STORAGE_KEY };

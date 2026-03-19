/**
 * Internationalization (i18n) module
 * Turkish only
 */

const STORAGE_KEY = 'bygog_lang';
const DEFAULT_LANG = 'tr';
const SUPPORTED_LANGS = ['tr'];

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
    'update.dataChanged': 'Yeni veriler mevcut',
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
    'batch.showCart': 'Sepeti göster',
    'batch.removeItem': '{name} öğesini kaldır',

    // Post-install
    'postInstall.title': 'Kurulum Sonrası',

    // Similar tools
    'similar.title': 'Benzer Araçlar',

    // Category scope
    'scope.clear': 'Kategori filtresini kaldır',
    'scope.label': 'Kategoride ara: {name}'
  }
};

let currentLang = DEFAULT_LANG;

/**
 * Initialize i18n
 */
export function initI18n() {
  currentLang = DEFAULT_LANG;
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
  document.documentElement.lang = lang;
}

/**
 * Get translation for key
 * @param {string} key
 * @param {object} params - Optional interpolation params
 * @returns {string}
 */
export function t(key, params = {}) {
  const langData = translations[currentLang] || translations[DEFAULT_LANG];
  let text = langData[key] || key;

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

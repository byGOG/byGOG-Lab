/**
 * Internationalization (i18n) module
 * Turkish + English
 */

const STORAGE_KEY = 'bygog_lang';
const DEFAULT_LANG = 'tr';
const SUPPORTED_LANGS = ['tr', 'en'] as const;

type LangKey = (typeof SUPPORTED_LANGS)[number];

type TranslationKeys =
  | 'search.placeholder'
  | 'search.results'
  | 'search.noResults'
  | 'search.loading'
  | 'favorites.title'
  | 'favorites.add'
  | 'favorites.remove'
  | 'favorites.toggle'
  | 'copy.default'
  | 'copy.success'
  | 'copy.error'
  | 'copy.loading'
  | 'copy.tooltip'
  | 'copy.ariaLabel'
  | 'info.button'
  | 'info.official'
  | 'info.show'
  | 'info.close'
  | 'pwa.install'
  | 'pwa.installSub'
  | 'pwa.iosHint'
  | 'pwa.androidHint'
  | 'pwa.browserHint'
  | 'pwa.manualHint'
  | 'update.available'
  | 'update.refresh'
  | 'update.refreshAria'
  | 'update.dataChanged'
  | 'update.confirm'
  | 'error.linksLoad'
  | 'error.categoryLoad'
  | 'error.retry'
  | 'loading.category'
  | 'a11y.skipLink'
  | 'a11y.searchLabel'
  | 'a11y.favoritesLabel'
  | 'a11y.mainContent'
  | 'a11y.linkCategories'
  | 'a11y.openNewTab'
  | 'a11y.goHome'
  | 'footer.desc'
  | 'footer.copy'
  | 'filter.all'
  | 'filter.recommended'
  | 'filter.hasCopy'
  | 'filter.quickLabel'
  | 'badge.new'
  | 'badge.newAria'
  | 'recent.title'
  | 'share.label'
  | 'offline.message'
  | 'keyboard.title'
  | 'keyboard.ariaLabel'
  | 'keyboard.focusSearch'
  | 'keyboard.clearSearch'
  | 'keyboard.firstResult'
  | 'keyboard.prevNext'
  | 'keyboard.help'
  | 'keyboard.or'
  | 'nav.goToCategory'
  | 'nav.goToSubcategory'
  | 'nav.scrollUp'
  | 'nav.scrollDown'
  | 'featured.title'
  | 'newAdditions.title'
  | 'tags.label'
  | 'tags.clearAll'
  | 'batch.toggle'
  | 'batch.selected'
  | 'batch.generate'
  | 'batch.clear'
  | 'batch.copy'
  | 'batch.copied'
  | 'batch.title'
  | 'batch.empty'
  | 'batch.showCart'
  | 'batch.removeItem'
  | 'postInstall.title'
  | 'similar.title'
  | 'scope.clear'
  | 'scope.label'
  | 'sc.loadPlayer';

type TranslationMap = Record<TranslationKeys, string>;

const translations: Record<LangKey, TranslationMap> = {
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
    'error.retry': 'Tekrar dene',
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
    'footer.desc': 'Windows için en iyi araçlar, tek adreste.',
    'footer.copy': '© 2026 byGOG Lab. Tüm hakları saklıdır.',

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
    'nav.scrollUp': 'Yukarı Çık',
    'nav.scrollDown': 'Aşağı İn',

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
    'scope.label': 'Kategoride ara: {name}',

    // SoundCloud
    'sc.loadPlayer': 'SoundCloud oynatıcıyı yükle'
  },

  en: {
    // Search
    'search.placeholder': 'Search...',
    'search.results': '{count} results found',
    'search.noResults': 'No results found',
    'search.loading': 'Loading results...',

    // Favorites
    'favorites.title': 'My Favorites',
    'favorites.add': 'Add to Favorites',
    'favorites.remove': 'Remove from Favorites',
    'favorites.toggle': 'Toggle Favorite',

    // Copy
    'copy.default': 'Copy command',
    'copy.success': 'Command copied',
    'copy.error': 'Failed to copy',
    'copy.loading': 'Copying command',
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
    'pwa.manualHint': 'Use "Add to Home Screen" from your browser menu to install.',

    // Update
    'update.available': 'New version available',
    'update.refresh': 'Refresh',
    'update.refreshAria': 'Refresh page',
    'update.dataChanged': 'New data available',
    'update.confirm': 'A new update is available! Would you like to refresh?',

    // Errors
    'error.linksLoad': 'Failed to load links.',
    'error.categoryLoad': 'Failed to load.',
    'error.retry': 'Try again',
    'loading.category': 'Loading...',

    // Accessibility
    'a11y.skipLink': 'Skip to main content',
    'a11y.searchLabel': 'Site search',
    'a11y.favoritesLabel': 'Favorites',
    'a11y.mainContent': 'Main content',
    'a11y.linkCategories': 'Link categories',
    'a11y.openNewTab': '{name} — open in new tab',
    'a11y.goHome': 'Go to home page',

    // Footer
    'footer.desc': 'Best tools for Windows, all in one place.',
    'footer.copy': '© 2026 byGOG Lab. All rights reserved.',

    // Filters
    'filter.all': 'All',
    'filter.recommended': 'Recommended',
    'filter.hasCopy': 'Has Command',
    'filter.quickLabel': 'Quick filters',

    // New badge
    'badge.new': 'New',
    'badge.newAria': 'Newly added',

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
    'keyboard.clearSearch': 'Clear / close search',
    'keyboard.firstResult': 'Go to first result',
    'keyboard.prevNext': 'Previous / next category',
    'keyboard.help': 'This help screen',
    'keyboard.or': 'or',

    // Category nav
    'nav.goToCategory': 'Go to {name} category',
    'nav.goToSubcategory': 'Go to {name} subcategory',
    'nav.scrollUp': 'Scroll to top',
    'nav.scrollDown': 'Scroll to bottom',

    // Featured strip
    'featured.title': 'Featured Tools',

    // New additions strip
    'newAdditions.title': 'New Additions',

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
    'batch.showCart': 'Show cart',
    'batch.removeItem': 'Remove {name}',

    // Post-install
    'postInstall.title': 'Post-Install',

    // Similar tools
    'similar.title': 'Similar Tools',

    // Category scope
    'scope.clear': 'Clear category filter',
    'scope.label': 'Search in: {name}',

    // SoundCloud
    'sc.loadPlayer': 'Load SoundCloud player'
  }
};

let currentLang: LangKey = DEFAULT_LANG;

export function initI18n(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) {
      currentLang = stored as LangKey;
    } else {
      const browserLang = (navigator.language || '').split('-')[0].toLowerCase();
      currentLang = (SUPPORTED_LANGS as readonly string[]).includes(browserLang)
        ? (browserLang as LangKey)
        : DEFAULT_LANG;
    }
  } catch {
    currentLang = DEFAULT_LANG;
  }
  document.documentElement.lang = currentLang;
}

export function getLang(): string {
  return currentLang;
}

export function setLang(lang: string): void {
  if (!(SUPPORTED_LANGS as readonly string[]).includes(lang)) return;
  currentLang = lang as LangKey;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  window.dispatchEvent(new Event('langchange'));
}

export function t(key: string, params: Record<string, string | number> = {}): string {
  const langData = translations[currentLang] || translations[DEFAULT_LANG];
  let text = (langData as Record<string, string>)[key] || key;

  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });

  return text;
}

export function getTranslations(): TranslationMap {
  return translations[currentLang] || translations[DEFAULT_LANG];
}

export function getSupportedLangs(): string[] {
  return [...SUPPORTED_LANGS];
}

export function applyI18nToDom(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = t(key);
  });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
}

export function createLangSwitcher(): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lang-toggle';
  const update = (): void => {
    const next = getLang() === 'tr' ? 'en' : 'tr';
    btn.textContent = next.toUpperCase();
    btn.setAttribute('aria-label', next === 'en' ? 'Switch to English' : 'Türkçeye geç');
  };
  update();
  btn.addEventListener('click', () => {
    setLang(getLang() === 'tr' ? 'en' : 'tr');
  });
  window.addEventListener('langchange', update);

  const fab = document.querySelector('.author-fab');
  if (fab) fab.appendChild(btn);
  else document.body.appendChild(btn);
}

export { translations, SUPPORTED_LANGS, DEFAULT_LANG, STORAGE_KEY };

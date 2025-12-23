import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  t, 
  getLang, 
  setLang, 
  toggleLang, 
  initI18n,
  getSupportedLangs,
  DEFAULT_LANG,
  STORAGE_KEY
} from '../src/lib/i18n.js';

describe('i18n', () => {
  beforeEach(() => {
    // Reset to default language before each test
    setLang('tr');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { }
  });

  describe('getLang', () => {
    it('returns default language initially', () => {
      expect(getLang()).toBe('tr');
    });
  });

  describe('setLang', () => {
    it('sets language to English', () => {
      setLang('en');
      expect(getLang()).toBe('en');
    });

    it('ignores unsupported languages', () => {
      setLang('fr');
      expect(getLang()).toBe('tr');
    });

    it('saves language to localStorage', () => {
      // Mock localStorage for this test
      const storage = {};
      vi.stubGlobal('localStorage', {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; },
        removeItem: (key) => { delete storage[key]; }
      });
      
      setLang('en');
      expect(storage['bygog_lang']).toBe('en');
      
      vi.unstubAllGlobals();
    });
  });

  describe('toggleLang', () => {
    it('toggles from Turkish to English', () => {
      setLang('tr');
      const newLang = toggleLang();
      expect(newLang).toBe('en');
      expect(getLang()).toBe('en');
    });

    it('toggles from English to Turkish', () => {
      setLang('en');
      const newLang = toggleLang();
      expect(newLang).toBe('tr');
      expect(getLang()).toBe('tr');
    });
  });

  describe('t (translate)', () => {
    it('returns Turkish translation by default', () => {
      setLang('tr');
      expect(t('favorites.title')).toBe('Favorilerim');
    });

    it('returns English translation when set', () => {
      setLang('en');
      expect(t('favorites.title')).toBe('My Favorites');
    });

    it('returns key if translation not found', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('interpolates params correctly', () => {
      setLang('tr');
      expect(t('search.results', { count: 5 })).toBe('5 sonuç bulundu');
    });

    it('interpolates params in English', () => {
      setLang('en');
      expect(t('search.results', { count: 10 })).toBe('10 results found');
    });
  });

  describe('getSupportedLangs', () => {
    it('returns supported languages array', () => {
      const langs = getSupportedLangs();
      expect(langs).toContain('tr');
      expect(langs).toContain('en');
      expect(langs).toHaveLength(2);
    });
  });

  describe('initI18n', () => {
    it('loads saved language from localStorage', () => {
      // Mock localStorage for this test
      const storage = { 'bygog_lang': 'en' };
      vi.stubGlobal('localStorage', {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; },
        removeItem: (key) => { delete storage[key]; }
      });
      
      initI18n();
      expect(getLang()).toBe('en');
      
      vi.unstubAllGlobals();
    });
  });
});

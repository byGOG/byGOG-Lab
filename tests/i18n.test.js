import { describe, it, expect, beforeEach } from 'vitest';
import {
  t,
  getLang,
  setLang,
  initI18n,
  getSupportedLangs,
  STORAGE_KEY
} from '../src/lib/i18n.js';

describe('i18n', () => {
  beforeEach(() => {
    setLang('tr');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  });

  describe('getLang', () => {
    it('returns default language initially', () => {
      expect(getLang()).toBe('tr');
    });
  });

  describe('setLang', () => {
    it('ignores unsupported languages', () => {
      setLang('fr');
      expect(getLang()).toBe('tr');
    });

    it('ignores English (no longer supported)', () => {
      setLang('en');
      expect(getLang()).toBe('tr');
    });
  });

  describe('t (translate)', () => {
    it('returns Turkish translation by default', () => {
      setLang('tr');
      expect(t('favorites.title')).toBe('Favorilerim');
    });

    it('returns key if translation not found', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('interpolates params correctly', () => {
      setLang('tr');
      expect(t('search.results', { count: 5 })).toBe('5 sonuç bulundu');
    });
  });

  describe('getSupportedLangs', () => {
    it('returns supported languages array', () => {
      const langs = getSupportedLangs();
      expect(langs).toContain('tr');
      expect(langs).toHaveLength(1);
    });
  });

  describe('initI18n', () => {
    it('always uses Turkish', () => {
      initI18n();
      expect(getLang()).toBe('tr');
    });
  });
});

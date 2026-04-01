import { describe, it, expect, beforeEach } from 'vitest';
import { t, getLang, setLang, initI18n, getSupportedLangs, STORAGE_KEY } from '../src/lib/i18n.js';

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

    it('switches to English', () => {
      setLang('en');
      expect(getLang()).toBe('en');
    });

    it('switches back to Turkish', () => {
      setLang('en');
      setLang('tr');
      expect(getLang()).toBe('tr');
    });
  });

  describe('t (translate)', () => {
    it('returns Turkish translation by default', () => {
      setLang('tr');
      expect(t('favorites.title')).toBe('Favorilerim');
    });

    it('returns English translation when lang is en', () => {
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
      expect(t('search.results', { count: 3 })).toBe('3 results found');
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
    it('defaults to Turkish when no preference and browser lang not supported', () => {
      const orig = navigator.language;
      Object.defineProperty(navigator, 'language', { value: 'de', configurable: true });
      initI18n();
      expect(getLang()).toBe('tr');
      Object.defineProperty(navigator, 'language', { value: orig, configurable: true });
    });

    it('auto-detects English from browser language', () => {
      const orig = navigator.language;
      Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
      initI18n();
      expect(getLang()).toBe('en');
      Object.defineProperty(navigator, 'language', { value: orig, configurable: true });
    });

    it('restores saved language from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'en');
      initI18n();
      expect(getLang()).toBe('en');
    });
  });
});

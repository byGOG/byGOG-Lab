import { describe, it, expect } from 'vitest';
import { slugify, getCategoryNavIcon, categoryIcons } from '../src/lib/nav-utils.js';

describe('nav-utils', () => {
  describe('slugify', () => {
    it('converts to lowercase with Turkish locale', () => {
      expect(slugify('HELLO')).toBe('hello');
    });

    it('folds Turkish diacritics', () => {
      expect(slugify('Güvenlik')).toBe('guvenlik');
      expect(slugify('Araçlar')).toBe('araclar');
      expect(slugify('Yöneticiler')).toBe('yoneticiler');
    });

    it('replaces & with space then hyphen', () => {
      expect(slugify('Güvenlik & Gizlilik')).toBe('guvenlik-gizlilik');
    });

    it('replaces non-alphanumeric chars with hyphens', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
    });

    it('strips leading and trailing hyphens', () => {
      expect(slugify('--test--')).toBe('test');
    });

    it('returns "kategori" for empty input', () => {
      expect(slugify('')).toBe('kategori');
      expect(slugify(null)).toBe('kategori');
      expect(slugify(undefined)).toBe('kategori');
    });

    it('handles Turkish dotless i', () => {
      expect(slugify('İletişim')).toBe('iletisim');
    });

    it('collapses multiple hyphens', () => {
      expect(slugify('a   b   c')).toBe('a-b-c');
    });
  });

  describe('getCategoryNavIcon', () => {
    it('returns icon for known category', () => {
      const icon = getCategoryNavIcon('favorilerim');
      expect(icon).toBe(categoryIcons.favorilerim);
    });

    it('matches partial category names', () => {
      const icon = getCategoryNavIcon('Sistem Araçları & Bakım');
      expect(icon).toContain('svg');
    });

    it('returns default circle icon for unknown category', () => {
      const icon = getCategoryNavIcon('Unknown Category');
      expect(icon).toContain('circle');
    });

    it('is case-insensitive', () => {
      const icon = getCategoryNavIcon('OYUN');
      expect(icon).toBe(categoryIcons.oyun);
    });
  });
});

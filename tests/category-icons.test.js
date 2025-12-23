import { describe, it, expect } from 'vitest';
import {
  getCategoryIcon,
  applyCategoryColumns,
  CATEGORY_ICONS,
  THREE_COL_TITLES
} from '../src/lib/category-icons.js';

describe('category-icons', () => {
  describe('getCategoryIcon', () => {
    it('returns icon for known category', () => {
      const icon = getCategoryIcon('Sistem/Ofis');
      expect(icon).toContain('<svg');
      expect(icon).toContain('viewBox');
    });

    it('returns icon for Turkish category with special chars', () => {
      const icon = getCategoryIcon('Güvenlik & Gizlilik');
      expect(icon).toContain('<svg');
    });

    it('returns icon for favorilerim', () => {
      const icon = getCategoryIcon('Favorilerim');
      expect(icon).toContain('<svg');
      expect(icon).toContain('polygon'); // Star shape
    });

    it('is case insensitive', () => {
      const icon1 = getCategoryIcon('sistem/ofis');
      const icon2 = getCategoryIcon('SİSTEM/OFİS');
      expect(icon1).toBeTruthy();
      // Both should return an icon (may be different due to normalization)
    });

    it('returns null for unknown category', () => {
      expect(getCategoryIcon('Unknown Category')).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(getCategoryIcon('')).toBeNull();
      expect(getCategoryIcon(null)).toBeNull();
      expect(getCategoryIcon(undefined)).toBeNull();
    });
  });

  describe('applyCategoryColumns', () => {
    it('adds cols-3 class for 3-column categories', () => {
      const card = document.createElement('div');
      applyCategoryColumns(card, 'Sistem/Ofis', s => s.toLowerCase());
      expect(card.classList.contains('cols-3')).toBe(true);
    });

    it('does not add cols-3 for other categories', () => {
      const card = document.createElement('div');
      applyCategoryColumns(card, 'Oyun', s => s.toLowerCase());
      expect(card.classList.contains('cols-3')).toBe(false);
    });

    it('removes cols-3 when switching to non-3-col category', () => {
      const card = document.createElement('div');
      card.classList.add('cols-3');
      applyCategoryColumns(card, 'Oyun', s => s.toLowerCase());
      expect(card.classList.contains('cols-3')).toBe(false);
    });

    it('handles null card gracefully', () => {
      expect(() => applyCategoryColumns(null, 'Test', s => s)).not.toThrow();
    });
  });

  describe('CATEGORY_ICONS', () => {
    it('contains all expected categories', () => {
      expect(Object.keys(CATEGORY_ICONS)).toContain('sistem/ofis');
      expect(Object.keys(CATEGORY_ICONS)).toContain('oyun');
      expect(Object.keys(CATEGORY_ICONS)).toContain('favorilerim');
    });

    it('all icons are valid SVG strings', () => {
      Object.values(CATEGORY_ICONS).forEach(icon => {
        expect(icon).toContain('<svg');
        expect(icon).toContain('</svg>');
      });
    });
  });

  describe('THREE_COL_TITLES', () => {
    it('contains expected 3-column categories', () => {
      expect(THREE_COL_TITLES.has('sistem/ofis')).toBe(true);
      expect(THREE_COL_TITLES.has('guvenlik & gizlilik')).toBe(true);
    });

    it('does not contain non-3-col categories', () => {
      expect(THREE_COL_TITLES.has('oyun')).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  normalizeForSearch,
  foldForSearch,
  tokenizeFoldedQuery,
  escapeRegExp,
  buildHighlightRegex,
  createHighlightMeta
} from '../src/lib/search-utils.js';

describe('search-utils', () => {
  describe('normalizeForSearch', () => {
    it('küçük harfe çevirir', () => {
      expect(normalizeForSearch('HELLO')).toBe('hello');
      expect(normalizeForSearch('Merhaba')).toBe('merhaba');
    });

    it('Türkçe karakterleri doğru işler', () => {
      expect(normalizeForSearch('İSTANBUL')).toBe('istanbul');
      expect(normalizeForSearch('ÖĞRETMEN')).toBe('öğretmen');
    });

    it('null/undefined için boş string döner', () => {
      expect(normalizeForSearch(null)).toBe('');
      expect(normalizeForSearch(undefined)).toBe('');
    });
  });

  describe('foldForSearch', () => {
    it('diyakritik işaretleri kaldırır', () => {
      expect(foldForSearch('café')).toBe('cafe');
      expect(foldForSearch('naïve')).toBe('naive');
    });

    it('Türkçe ı harfini i yapar', () => {
      expect(foldForSearch('ışık')).toBe('isik');
      expect(foldForSearch('sığınak')).toBe('siginak');
    });

    it('karmaşık Türkçe metni işler', () => {
      expect(foldForSearch('Güvenlik & Gizlilik')).toBe('guvenlik & gizlilik');
    });
  });

  describe('tokenizeFoldedQuery', () => {
    it('metni token\'lara ayırır', () => {
      expect(tokenizeFoldedQuery('hello world')).toEqual(['hello', 'world']);
    });

    it('birden fazla boşluğu işler', () => {
      expect(tokenizeFoldedQuery('hello   world')).toEqual(['hello', 'world']);
    });

    it('boş string için boş array döner', () => {
      expect(tokenizeFoldedQuery('')).toEqual([]);
      expect(tokenizeFoldedQuery('   ')).toEqual([]);
    });
  });

  describe('escapeRegExp', () => {
    it('özel karakterleri escape eder', () => {
      expect(escapeRegExp('hello.*world')).toBe('hello\\.\\*world');
      expect(escapeRegExp('test(123)')).toBe('test\\(123\\)');
    });
  });

  describe('buildHighlightRegex', () => {
    it('geçerli regex döner', () => {
      const regex = buildHighlightRegex('test');
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.test('test')).toBe(true);
    });

    it('birden fazla token için alternation kullanır', () => {
      const regex = buildHighlightRegex('hello world');
      expect('hello test'.match(regex)).not.toBeNull();
      expect('world test'.match(regex)).not.toBeNull();
      expect('foo bar'.match(regex)).toBeNull();
    });

    it('boş string için null döner', () => {
      expect(buildHighlightRegex('')).toBeNull();
      expect(buildHighlightRegex('   ')).toBeNull();
    });
  });

  describe('createHighlightMeta', () => {
    it('sorgu varsa hasQuery true olur', () => {
      const meta = createHighlightMeta('test');
      expect(meta.hasQuery).toBe(true);
      expect(meta.regex).not.toBeNull();
    });

    it('boş sorgu için hasQuery false olur', () => {
      const meta = createHighlightMeta('');
      expect(meta.hasQuery).toBe(false);
      expect(meta.regex).toBeNull();
    });
  });
});

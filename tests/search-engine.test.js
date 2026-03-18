import { describe, it, expect } from 'vitest';
import {
  normalizeForSearch,
  foldForSearch,
  tokenizeFoldedQuery,
  escapeRegExp,
  buildHighlightRegex,
  createHighlightMeta,
  SEARCH_LOCALE
} from '../src/lib/search-engine.js';

describe('search-engine', () => {
  describe('normalizeForSearch', () => {
    it('converts to lowercase using Turkish locale', () => {
      expect(normalizeForSearch('GİTHUB')).toBe('github');
    });

    it('handles empty input', () => {
      expect(normalizeForSearch('')).toBe('');
      expect(normalizeForSearch(null)).toBe('');
      expect(normalizeForSearch(undefined)).toBe('');
    });
  });

  describe('foldForSearch', () => {
    it('removes diacritics', () => {
      expect(foldForSearch('café')).toBe('cafe');
    });

    it('converts Turkish ı to i', () => {
      expect(foldForSearch('ılık')).toBe('ilik');
    });

    it('handles Turkish İ', () => {
      expect(foldForSearch('İstanbul')).toBe('istanbul');
    });

    it('normalizes to lowercase', () => {
      expect(foldForSearch('GITHUB')).toBe('github');
    });
  });

  describe('tokenizeFoldedQuery', () => {
    it('splits query into tokens', () => {
      expect(tokenizeFoldedQuery('hello world')).toEqual(['hello', 'world']);
    });

    it('handles multiple spaces', () => {
      expect(tokenizeFoldedQuery('hello    world')).toEqual(['hello', 'world']);
    });

    it('folds tokens', () => {
      expect(tokenizeFoldedQuery('İstanbul Ankara')).toEqual(['istanbul', 'ankara']);
    });

    it('filters empty tokens', () => {
      expect(tokenizeFoldedQuery('   ')).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(tokenizeFoldedQuery('')).toEqual([]);
    });
  });

  describe('escapeRegExp', () => {
    it('escapes special regex characters', () => {
      expect(escapeRegExp('a.b')).toBe('a\\.b');
      expect(escapeRegExp('a*b')).toBe('a\\*b');
      expect(escapeRegExp('a+b')).toBe('a\\+b');
      expect(escapeRegExp('a?b')).toBe('a\\?b');
      expect(escapeRegExp('a^b')).toBe('a\\^b');
      expect(escapeRegExp('a$b')).toBe('a\\$b');
    });

    it('escapes brackets', () => {
      expect(escapeRegExp('[a]')).toBe('\\[a\\]');
      expect(escapeRegExp('(a)')).toBe('\\(a\\)');
      expect(escapeRegExp('{a}')).toBe('\\{a\\}');
    });

    it('escapes pipe and backslash', () => {
      expect(escapeRegExp('a|b')).toBe('a\\|b');
      expect(escapeRegExp('a\\b')).toBe('a\\\\b');
    });

    it('leaves normal characters unchanged', () => {
      expect(escapeRegExp('hello world')).toBe('hello world');
    });
  });

  describe('buildHighlightRegex', () => {
    it('builds regex from single token', () => {
      const regex = buildHighlightRegex('hello');
      expect(regex).toBeInstanceOf(RegExp);
      expect('hello world'.match(regex)).toBeTruthy();
    });

    it('builds regex from multiple tokens', () => {
      const regex = buildHighlightRegex('hello world');
      expect('hello'.match(regex)).toBeTruthy();
      expect('world'.match(regex)).toBeTruthy();
    });

    it('is case insensitive', () => {
      const regex = buildHighlightRegex('hello');
      expect('HELLO'.match(regex)).toBeTruthy();
      expect('HeLLo'.match(regex)).toBeTruthy();
    });

    it('returns null for empty query', () => {
      expect(buildHighlightRegex('')).toBeNull();
      expect(buildHighlightRegex('   ')).toBeNull();
    });
  });

  describe('createHighlightMeta', () => {
    it('creates meta with hasQuery=true for non-empty query', () => {
      const meta = createHighlightMeta('test');
      expect(meta.hasQuery).toBe(true);
      expect(meta.raw).toBe('test');
      expect(meta.regex).toBeInstanceOf(RegExp);
    });

    it('creates meta with hasQuery=false for empty query', () => {
      const meta = createHighlightMeta('');
      expect(meta.hasQuery).toBe(false);
      expect(meta.regex).toBeNull();
    });

    it('creates meta with hasQuery=false for whitespace-only query', () => {
      const meta = createHighlightMeta('   ');
      expect(meta.hasQuery).toBe(false);
    });
  });

  describe('SEARCH_LOCALE', () => {
    it('is Turkish locale', () => {
      expect(SEARCH_LOCALE).toBe('tr');
    });
  });
});

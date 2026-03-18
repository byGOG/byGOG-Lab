import { describe, it, expect } from 'vitest';
import { levenshtein, maxDistance, fuzzyMatch } from '../src/lib/fuzzy.js';

describe('fuzzy', () => {
  describe('levenshtein', () => {
    it('returns 0 for identical strings', () => {
      expect(levenshtein('hello', 'hello')).toBe(0);
    });

    it('returns length of other string when one is empty', () => {
      expect(levenshtein('', 'abc')).toBe(3);
      expect(levenshtein('abc', '')).toBe(3);
    });

    it('returns 0 for two empty strings', () => {
      expect(levenshtein('', '')).toBe(0);
    });

    it('calculates correct distance for substitutions', () => {
      expect(levenshtein('cat', 'bat')).toBe(1);
      expect(levenshtein('cat', 'car')).toBe(1);
    });

    it('calculates correct distance for insertions/deletions', () => {
      expect(levenshtein('cat', 'cats')).toBe(1);
      expect(levenshtein('cats', 'cat')).toBe(1);
    });

    it('calculates correct distance for complex cases', () => {
      expect(levenshtein('kitten', 'sitting')).toBe(3);
      expect(levenshtein('sunday', 'saturday')).toBe(3);
    });
  });

  describe('maxDistance', () => {
    it('returns 0 for tokens shorter than 3 chars', () => {
      expect(maxDistance('ab')).toBe(0);
      expect(maxDistance('a')).toBe(0);
    });

    it('returns 1 for tokens 3-5 chars', () => {
      expect(maxDistance('abc')).toBe(1);
      expect(maxDistance('abcde')).toBe(1);
    });

    it('returns 2 for tokens 6+ chars', () => {
      expect(maxDistance('abcdef')).toBe(2);
      expect(maxDistance('longtoken')).toBe(2);
    });
  });

  describe('fuzzyMatch', () => {
    it('returns false for short tokens (< 3 chars)', () => {
      expect(fuzzyMatch('ab', 'abc')).toBe(false);
    });

    it('matches single char typo in browser name', () => {
      expect(fuzzyMatch('chrme', 'chrome browser')).toBe(true);
    });

    it('matches transposed chars', () => {
      expect(fuzzyMatch('steaam', 'steam game platform')).toBe(true);
    });

    it('does not match completely different words', () => {
      expect(fuzzyMatch('xyz', 'chrome browser')).toBe(false);
    });

    it('matches with 2 edit distance for long tokens', () => {
      expect(fuzzyMatch('firefx', 'firefox browser')).toBe(true);
    });

    it('does not match when distance exceeds threshold', () => {
      expect(fuzzyMatch('abcde', 'xyz')).toBe(false);
    });

    it('handles fuzzy prefix matching for longer tokens', () => {
      expect(fuzzyMatch('bitwrden', 'bitwarden password manager')).toBe(true);
    });

    it('skips very short words in text', () => {
      expect(fuzzyMatch('abc', 'a b c')).toBe(false);
    });
  });
});

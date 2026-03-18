import { describe, it, expect } from 'vitest';
import {
  getDomainLabel,
  getDomainBase,
  normalizeTag,
  isSvgIcon,
  isOfficialLink,
  MULTI_PART_TLDS
} from '../src/lib/domain-utils.js';

describe('domain-utils', () => {
  describe('getDomainLabel', () => {
    it('extracts domain from simple URL', () => {
      expect(getDomainLabel('https://github.com/user/repo')).toBe('github.com');
    });

    it('removes www prefix', () => {
      expect(getDomainLabel('https://www.google.com')).toBe('google.com');
    });

    it('handles multi-part TLDs like .com.tr', () => {
      expect(getDomainLabel('https://www.example.com.tr')).toBe('example.com.tr');
    });

    it('handles .co.uk domains', () => {
      expect(getDomainLabel('https://www.bbc.co.uk/news')).toBe('bbc.co.uk');
    });

    it('returns empty string for empty input', () => {
      expect(getDomainLabel('')).toBe('');
      expect(getDomainLabel(null)).toBe('');
      expect(getDomainLabel(undefined)).toBe('');
    });

    it('handles IP addresses', () => {
      expect(getDomainLabel('http://192.168.1.1:8080/path')).toBe('192.168.1.1');
    });

    it('handles invalid URLs gracefully', () => {
      expect(getDomainLabel('not-a-url')).toBe('');
    });
  });

  describe('getDomainBase', () => {
    it('extracts base from simple domain', () => {
      expect(getDomainBase('github.com')).toBe('github');
    });

    it('extracts base from multi-part TLD', () => {
      expect(getDomainBase('example.com.tr')).toBe('example');
    });

    it('handles IP addresses', () => {
      expect(getDomainBase('192.168.1.1')).toBe('192.168.1.1');
    });

    it('returns empty for empty input', () => {
      expect(getDomainBase('')).toBe('');
    });
  });

  describe('normalizeTag', () => {
    it('converts to lowercase', () => {
      expect(normalizeTag('GitHub')).toBe('github');
    });

    it('handles Turkish characters', () => {
      expect(normalizeTag('İstanbul')).toBe('istanbul');
      expect(normalizeTag('Güvenlik')).toBe('guvenlik');
    });

    it('removes diacritics', () => {
      expect(normalizeTag('café')).toBe('cafe');
    });

    it('trims whitespace', () => {
      expect(normalizeTag('  test  ')).toBe('test');
    });

    it('handles null/undefined', () => {
      expect(normalizeTag(null)).toBe('');
      expect(normalizeTag(undefined)).toBe('');
    });
  });

  describe('isSvgIcon', () => {
    it('returns true for .svg files', () => {
      expect(isSvgIcon('icon.svg')).toBe(true);
      expect(isSvgIcon('/path/to/icon.svg')).toBe(true);
    });

    it('returns true for .svg with query params', () => {
      expect(isSvgIcon('icon.svg?v=1')).toBe(true);
    });

    it('returns true for .svg with hash', () => {
      expect(isSvgIcon('icon.svg#symbol')).toBe(true);
    });

    it('returns false for non-svg files', () => {
      expect(isSvgIcon('icon.png')).toBe(false);
      expect(isSvgIcon('icon.jpg')).toBe(false);
    });

    it('handles empty input', () => {
      expect(isSvgIcon('')).toBe(false);
      expect(isSvgIcon(null)).toBe(false);
    });
  });

  describe('isOfficialLink', () => {
    it('returns true for explicit official flag', () => {
      expect(isOfficialLink({ official: true }, 'example.com')).toBe(true);
      expect(isOfficialLink({ official: 'true' }, 'example.com')).toBe(true);
    });

    it('returns true when domain matches tag', () => {
      expect(isOfficialLink({ tags: ['github'] }, 'github.com')).toBe(true);
    });

    it('returns false when domain does not match', () => {
      expect(isOfficialLink({ tags: ['microsoft'] }, 'github.com')).toBe(false);
    });

    it('returns false for empty domain', () => {
      expect(isOfficialLink({ tags: ['test'] }, '')).toBe(false);
    });

    it('handles missing tags array', () => {
      expect(isOfficialLink({}, 'example.com')).toBe(false);
    });
  });

  describe('MULTI_PART_TLDS', () => {
    it('contains common multi-part TLDs', () => {
      expect(MULTI_PART_TLDS.has('com.tr')).toBe(true);
      expect(MULTI_PART_TLDS.has('co.uk')).toBe(true);
      expect(MULTI_PART_TLDS.has('com.au')).toBe(true);
    });
  });
});

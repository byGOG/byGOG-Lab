import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchLinks,
  fetchLinksLegacy,
  isLinksIndex,
  LINKS_INDEX_PATH,
  LINKS_FALLBACK_PATH
} from '../src/lib/data-fetcher.js';

describe('data-fetcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isLinksIndex', () => {
    it('returns true for valid index format', () => {
      const data = {
        categories: [
          { file: 'data/cat1.json', title: 'Category 1' },
          { file: 'data/cat2.json', title: 'Category 2' }
        ]
      };
      expect(isLinksIndex(data)).toBe(true);
    });

    it('returns false for legacy format (with links array)', () => {
      const data = {
        categories: [
          { title: 'Category 1', links: [] }
        ]
      };
      expect(isLinksIndex(data)).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isLinksIndex(null)).toBe(false);
      expect(isLinksIndex(undefined)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isLinksIndex({})).toBe(false);
    });

    it('returns false when categories is not an array', () => {
      expect(isLinksIndex({ categories: 'not array' })).toBe(false);
    });
  });

  describe('fetchLinks', () => {
    it('returns index mode for valid index data', async () => {
      const indexData = {
        categories: [{ file: 'data/cat1.json', title: 'Cat 1' }]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(indexData)
      });

      const result = await fetchLinks();
      expect(result.mode).toBe('index');
      expect(result.data).toEqual(indexData);
    });

    it('returns full mode for legacy data format', async () => {
      const legacyData = {
        categories: [{ title: 'Cat 1', links: [] }]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(legacyData)
      });

      const result = await fetchLinks();
      expect(result.mode).toBe('full');
      expect(result.data).toEqual(legacyData);
    });

    it('falls back to legacy fetch when index fails', async () => {
      const legacyData = { categories: [] };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: false }) // Index fetch fails
        .mockResolvedValueOnce({ 
          ok: true, 
          json: () => Promise.resolve(legacyData) 
        }); // Legacy fetch succeeds

      const result = await fetchLinks();
      expect(result.mode).toBe('full');
      expect(result.data).toEqual(legacyData);
    });
  });

  describe('fetchLinksLegacy', () => {
    it('fetches from fallback path', async () => {
      const data = { categories: [] };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data)
      });

      const result = await fetchLinksLegacy();
      expect(fetch).toHaveBeenCalledWith(LINKS_FALLBACK_PATH);
      expect(result).toEqual(data);
    });

    it('throws error when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      await expect(fetchLinksLegacy()).rejects.toThrow('links.json yüklenemedi');
    });
  });

  describe('Constants', () => {
    it('exports correct paths', () => {
      expect(LINKS_INDEX_PATH).toBe('data/links-index.json');
      expect(LINKS_FALLBACK_PATH).toBe('links.json');
    });
  });
});

/**
 * Favorites modülü testleri
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] ?? null)
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Modül her test için yeniden yüklenecek
let favorites;

describe('favorites', () => {
  beforeEach(async () => {
    localStorageMock.clear();
    vi.resetModules();
    favorites = await import('../src/lib/favorites.js');
  });

  describe('getFavorites', () => {
    it('varsayılan favorileri döndürür', () => {
      const favs = favorites.getFavorites();
      expect(favs).toBeInstanceOf(Set);
      expect(favs.size).toBeGreaterThan(0);
    });

    it('kopya Set döndürür (immutable)', () => {
      const favs1 = favorites.getFavorites();
      const favs2 = favorites.getFavorites();
      expect(favs1).not.toBe(favs2);
    });
  });

  describe('isFavorite', () => {
    it('varsayılan favori için true döndürür', () => {
      const defaults = favorites.getDefaultFavorites();
      expect(favorites.isFavorite(defaults[0])).toBe(true);
    });

    it('olmayan favori için false döndürür', () => {
      expect(favorites.isFavorite('NonExistentItem12345')).toBe(false);
    });
  });

  describe('addFavorite', () => {
    it('yeni favori ekler ve true döndürür', () => {
      const result = favorites.addFavorite('TestItem');
      expect(result).toBe(true);
      expect(favorites.isFavorite('TestItem')).toBe(true);
    });

    it('mevcut favori için false döndürür', () => {
      favorites.addFavorite('TestItem');
      const result = favorites.addFavorite('TestItem');
      expect(result).toBe(false);
    });

    it('localStorage\'a kaydeder', () => {
      favorites.addFavorite('TestItem');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    it('mevcut favoriyi kaldırır ve true döndürür', () => {
      favorites.addFavorite('TestItem');
      const result = favorites.removeFavorite('TestItem');
      expect(result).toBe(true);
      expect(favorites.isFavorite('TestItem')).toBe(false);
    });

    it('olmayan favori için false döndürür', () => {
      const result = favorites.removeFavorite('NonExistentItem12345');
      expect(result).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('olmayan favoriyi ekler ve true döndürür', () => {
      const result = favorites.toggleFavorite('ToggleTest');
      expect(result).toBe(true);
      expect(favorites.isFavorite('ToggleTest')).toBe(true);
    });

    it('mevcut favoriyi kaldırır ve false döndürür', () => {
      favorites.addFavorite('ToggleTest');
      const result = favorites.toggleFavorite('ToggleTest');
      expect(result).toBe(false);
      expect(favorites.isFavorite('ToggleTest')).toBe(false);
    });
  });

  describe('onFavoritesChange', () => {
    it('değişiklik dinleyicisi ekler', () => {
      const callback = vi.fn();
      favorites.onFavoritesChange(callback);
      favorites.addFavorite('ListenerTest');
      expect(callback).toHaveBeenCalled();
    });

    it('unsubscribe fonksiyonu döndürür', () => {
      const callback = vi.fn();
      const unsubscribe = favorites.onFavoritesChange(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe sonrası callback çağrılmaz', () => {
      const callback = vi.fn();
      const unsubscribe = favorites.onFavoritesChange(callback);
      unsubscribe();
      favorites.addFavorite('UnsubTest');
      // İlk addFavorite öncesinde callback zaten eklenmişti
      // Bu yüzden callback sayısını kontrol ediyoruz
      const callCountBefore = callback.mock.calls.length;
      favorites.addFavorite('UnsubTest2');
      expect(callback.mock.calls.length).toBe(callCountBefore);
    });
  });

  describe('getDefaultFavorites', () => {
    it('varsayılan favorileri array olarak döndürür', () => {
      const defaults = favorites.getDefaultFavorites();
      expect(Array.isArray(defaults)).toBe(true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('kopya array döndürür', () => {
      const defaults1 = favorites.getDefaultFavorites();
      const defaults2 = favorites.getDefaultFavorites();
      expect(defaults1).not.toBe(defaults2);
    });
  });

  describe('resetToDefaults', () => {
    it('favorileri varsayılana sıfırlar', () => {
      favorites.addFavorite('CustomItem1');
      favorites.addFavorite('CustomItem2');
      favorites.resetToDefaults();
      
      const favs = favorites.getFavorites();
      const defaults = favorites.getDefaultFavorites();
      
      expect(favs.has('CustomItem1')).toBe(false);
      expect(favs.size).toBe(defaults.length);
    });
  });

  describe('localStorage persistence', () => {
    it('kaydedilen favorileri yükler', async () => {
      const testData = ['Item1', 'Item2', 'Item3'];
      localStorageMock.setItem('bygog_favs', JSON.stringify(testData));
      
      vi.resetModules();
      const freshFavorites = await import('../src/lib/favorites.js');
      
      expect(freshFavorites.isFavorite('Item1')).toBe(true);
      expect(freshFavorites.isFavorite('Item2')).toBe(true);
      expect(freshFavorites.isFavorite('Item3')).toBe(true);
    });

    it('bozuk JSON ile varsayılana döner', async () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json {{{');
      
      vi.resetModules();
      const freshFavorites = await import('../src/lib/favorites.js');
      
      const favs = freshFavorites.getFavorites();
      expect(favs.size).toBeGreaterThan(0);
    });
  });
});

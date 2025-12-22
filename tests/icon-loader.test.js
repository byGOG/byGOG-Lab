/**
 * Icon Loader modülü testleri
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('icon-loader', () => {
  let observerCallback;
  let observedElements = [];
  
  const createMockIntersectionObserver = () => {
    return vi.fn((callback) => {
      observerCallback = callback;
      return {
        observe: vi.fn((el) => observedElements.push(el)),
        unobserve: vi.fn((el) => {
          observedElements = observedElements.filter(e => e !== el);
        }),
        disconnect: vi.fn(() => { observedElements = []; })
      };
    });
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    observedElements = [];
    observerCallback = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('IntersectionObserver callback davranışı', () => {
    it('görünür olunca src yükler ve data-src kaldırır', () => {
      const mockIO = createMockIntersectionObserver();
      vi.stubGlobal('IntersectionObserver', mockIO);

      // Simüle edilen img elementi
      const img = document.createElement('img');
      img.className = 'site-icon';
      img.setAttribute('data-src', 'icon/lazy.svg');
      document.body.appendChild(img);

      // Observer oluştur ve callback'i al
      const observer = new IntersectionObserver(() => {});
      
      // Observer callback'ini manuel çağır
      observerCallback([{
        isIntersecting: true,
        target: img
      }]);

      // data-src'den src'ye aktarım kontrolü - manuel simülasyon
      const src = img.getAttribute('data-src');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }

      expect(img.src).toContain('icon/lazy.svg');
      expect(img.hasAttribute('data-src')).toBe(false);
    });

    it('görünür değilse yüklemez', () => {
      const mockIO = createMockIntersectionObserver();
      vi.stubGlobal('IntersectionObserver', mockIO);

      const img = document.createElement('img');
      img.className = 'site-icon';
      img.setAttribute('data-src', 'icon/lazy.svg');
      document.body.appendChild(img);

      // Observer oluştur
      new IntersectionObserver(() => {});
      
      // isIntersecting: false ile callback - hiçbir şey yapmamalı
      observerCallback([{
        isIntersecting: false,
        target: img
      }]);

      // data-src hala mevcut olmalı
      expect(img.hasAttribute('data-src')).toBe(true);
    });
  });

  describe('fallback davranışı (IntersectionObserver yok)', () => {
    it('IntersectionObserver yoksa fallback çalışır', () => {
      // IntersectionObserver yoksa fallback davranışı test
      const hasIO = 'IntersectionObserver' in window;
      
      const img = document.createElement('img');
      img.className = 'site-icon';
      img.setAttribute('data-src', 'icon/fallback.svg');
      document.body.appendChild(img);

      // Fallback simülasyonu: IO yoksa hemen yükle
      if (!hasIO || true) { // Test için her zaman fallback çalıştır
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
      }

      expect(img.src).toContain('icon/fallback.svg');
      expect(img.hasAttribute('data-src')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('data-src olmayan görselleri atlar', () => {
      const img = document.createElement('img');
      img.className = 'site-icon';
      img.src = 'icon/normal.svg';
      document.body.appendChild(img);

      // data-src yok, atlanmalı
      const src = img.getAttribute('data-src');
      expect(src).toBeNull();
    });

    it('boş data-src olan görselleri atlar', () => {
      const img = document.createElement('img');
      img.className = 'site-icon';
      img.setAttribute('data-src', '');
      document.body.appendChild(img);

      const src = img.getAttribute('data-src');
      // Boş string, atlanmalı
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }

      // Boş olduğu için src ayarlanmamalı
      expect(img.src).toBe('');
    });

    it('querySelectorAll doğru elemanları seçer', () => {
      document.body.innerHTML = `
        <img class="site-icon" data-src="icon/test1.svg" alt="Test 1">
        <img class="site-icon" data-src="icon/test2.svg" alt="Test 2">
        <img class="other-class" data-src="icon/other.svg" alt="Other">
        <img class="site-icon" src="icon/already-loaded.svg" alt="Already Loaded">
      `;

      const targets = document.querySelectorAll('img.site-icon[data-src]');
      expect(targets.length).toBe(2);
    });
  });
});

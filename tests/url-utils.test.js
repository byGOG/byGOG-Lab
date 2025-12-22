import { describe, it, expect } from 'vitest';
import {
  getDomainLabel,
  getDomainBase,
  normalizeTag,
  isOfficialLink,
  isSvgIcon
} from '../src/lib/url-utils.js';

describe('url-utils', () => {
  describe('getDomainLabel', () => {
    it('basit domain\'i döner', () => {
      expect(getDomainLabel('https://example.com/page')).toBe('example.com');
    });

    it('www prefix\'i kaldırır', () => {
      expect(getDomainLabel('https://www.example.com')).toBe('example.com');
    });

    it('çok parçalı TLD\'leri işler', () => {
      expect(getDomainLabel('https://example.com.tr')).toBe('example.com.tr');
      expect(getDomainLabel('https://test.co.uk')).toBe('test.co.uk');
    });

    it('subdomain\'li URL\'leri işler', () => {
      expect(getDomainLabel('https://blog.example.com')).toBe('example.com');
    });

    it('geçersiz URL için boş string döner', () => {
      expect(getDomainLabel('')).toBe('');
      expect(getDomainLabel(null)).toBe('');
    });

    it('IP adreslerini döner', () => {
      expect(getDomainLabel('http://192.168.1.1:8080/path')).toBe('192.168.1.1');
    });
  });

  describe('getDomainBase', () => {
    it('TLD\'yi kaldırır', () => {
      expect(getDomainBase('example.com')).toBe('example');
      expect(getDomainBase('test.org')).toBe('test');
    });

    it('çok parçalı TLD\'leri işler', () => {
      expect(getDomainBase('example.com.tr')).toBe('example');
      expect(getDomainBase('test.co.uk')).toBe('test');
    });

    it('IP adreslerini olduğu gibi döner', () => {
      expect(getDomainBase('192.168.1.1')).toBe('192.168.1.1');
    });
  });

  describe('normalizeTag', () => {
    it('küçük harfe çevirir ve normalleştirir', () => {
      expect(normalizeTag('GitHub')).toBe('github');
      expect(normalizeTag('STEAM')).toBe('steam');
    });

    it('Türkçe karakterleri işler', () => {
      expect(normalizeTag('Güvenlik')).toBe('guvenlik');
    });
  });

  describe('isOfficialLink', () => {
    it('official: true için true döner', () => {
      expect(isOfficialLink({ official: true }, 'example.com')).toBe(true);
    });

    it('tag eşleşmesi için true döner', () => {
      expect(isOfficialLink({ tags: ['github'] }, 'github.com')).toBe(true);
    });

    it('eşleşme yoksa false döner', () => {
      expect(isOfficialLink({ tags: ['test'] }, 'example.com')).toBe(false);
    });
  });

  describe('isSvgIcon', () => {
    it('SVG dosyalarını tanır', () => {
      expect(isSvgIcon('icon/test.svg')).toBe(true);
      expect(isSvgIcon('icon/test.SVG')).toBe(true);
    });

    it('query string\'li SVG\'leri tanır', () => {
      expect(isSvgIcon('icon/test.svg?v=1')).toBe(true);
    });

    it('diğer formatlar için false döner', () => {
      expect(isSvgIcon('icon/test.png')).toBe(false);
      expect(isSvgIcon('icon/test.jpg')).toBe(false);
    });
  });
});

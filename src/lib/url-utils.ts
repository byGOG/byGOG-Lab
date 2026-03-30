/**
 * URL ve domain işlemleri
 */

import type { Link } from '../types.js';

const MULTI_PART_TLDS = new Set([
  'com.tr',
  'org.tr',
  'net.tr',
  'gov.tr',
  'edu.tr',
  'bel.tr',
  'k12.tr',
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'com.au',
  'net.au',
  'org.au',
  'com.br',
  'com.mx',
  'com.ar',
  'com.co',
  'com.cl',
  'com.pe',
  'co.jp',
  'co.kr',
  'co.nz',
  'co.in',
  'com.sa',
  'com.sg'
]);

const SORTED_MULTI_TLDS = Array.from(MULTI_PART_TLDS).sort((a, b) => b.length - a.length);

export function getDomainLabel(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(String(url));
    let host = String(parsed.hostname || '').toLowerCase();
    if (!host) return '';
    if (host.startsWith('www.')) host = host.slice(4);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
    const parts = host.split('.');
    if (parts.length <= 2) return host;
    const tail2 = parts.slice(-2).join('.');
    if (MULTI_PART_TLDS.has(tail2)) return parts.slice(-3).join('.');
    return tail2;
  } catch {
    return '';
  }
}

export function getDomainBase(label: string): string {
  if (!label) return '';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(label)) return label;
  for (const tld of SORTED_MULTI_TLDS) {
    const suffix = `.${tld}`;
    if (label.endsWith(suffix)) {
      return label.slice(0, -suffix.length);
    }
  }
  const idx = label.lastIndexOf('.');
  return idx > 0 ? label.slice(0, idx) : label;
}

export function normalizeTag(value: string): string {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

export function isOfficialLink(link: Partial<Link> | null, domainLabel: string): boolean {
  if (link && (link.official === true || String(link.official).toLowerCase() === 'true')) {
    return true;
  }
  if (!domainLabel) return false;
  const base = normalizeTag(getDomainBase(domainLabel));
  if (!base) return false;
  const tags = Array.isArray(link?.tags) ? link.tags : [];
  return tags.some(tag => normalizeTag(tag) === base);
}

export function isSvgIcon(value: string): boolean {
  return /\.svg(?:[?#].*)?$/i.test(String(value || ''));
}

export default {
  getDomainLabel,
  getDomainBase,
  normalizeTag,
  isOfficialLink,
  isSvgIcon,
  MULTI_PART_TLDS
};

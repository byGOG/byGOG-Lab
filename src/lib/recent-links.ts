/**
 * Recently used links tracker
 * Stores clicked external links in localStorage and renders a strip.
 */
import { t } from './i18n.js';

interface RecentItem {
  name: string;
  url: string;
  icon: string;
}

const STORAGE_KEY = 'bygog_recent';
const MAX_ITEMS = 20;
let _container: HTMLElement | null = null;

function loadRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: RecentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

/**
 * Track a link click. Call this from a delegated click handler.
 */
export function trackClick(name: string, url: string, icon?: string): void {
  if (!name || !url) return;
  const items = loadRecent().filter(i => i.name !== name);
  items.unshift({ name, url, icon: icon || '' });
  if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
  saveRecent(items);
  if (_container) renderRecentStrip(_container);

  // Also track in visited set (no limit)
  try {
    const visited = getVisitedNames();
    visited.add(name);
    localStorage.setItem('bygog_visited', JSON.stringify([...visited]));
  } catch {}
}

export function getVisitedNames(): Set<string> {
  try {
    const raw = localStorage.getItem('bygog_visited');
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Render the "Son Kullanılanlar" strip above the container.
 */
export function renderRecentStrip(container: HTMLElement): void {
  if (!container) return;
  _container = container;

  // Remove existing strip
  const existing = container.parentElement?.querySelector('.recent-strip');
  if (existing) existing.remove();

  const items = loadRecent();
  if (!items.length) return;

  const strip = document.createElement('div');
  strip.className = 'recent-strip';

  const title = document.createElement('div');
  title.className = 'recent-strip-title';
  title.textContent = t('recent.title');
  strip.appendChild(title);

  const list = document.createElement('div');
  list.className = 'recent-strip-list';
  list.setAttribute('role', 'list');

  const visible = items.slice(0, 5);
  visible.forEach((item, i) => {
    const a = document.createElement('a');
    a.className = 'recent-strip-item';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');
    a.style.setProperty('--i', String(i));

    const num = document.createElement('span');
    num.className = 'recent-item-num';
    num.textContent = String(i + 1);
    a.appendChild(num);

    if (item.icon) {
      const img = document.createElement('img');
      img.className = 'recent-item-icon';
      img.src = item.icon;
      img.alt = '';
      img.width = 18;
      img.height = 18;
      img.loading = 'lazy';
      img.onerror = () => {
        img.src = 'icon/fallback.svg';
      };
      a.appendChild(img);
    }

    const name = document.createElement('span');
    name.className = 'recent-item-name';
    name.textContent = item.name;
    a.appendChild(name);

    list.appendChild(a);
  });

  strip.appendChild(list);
  container.parentElement!.insertBefore(strip, container);
}

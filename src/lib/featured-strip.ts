/**
 * Featured tools strip — shows top recommended tools at the top of the page.
 */
import { t } from './i18n.js';

interface FeaturedItem {
  name: string;
  url: string;
  icon: string;
}

/**
 * Render the featured tools strip.
 */
export function renderFeaturedStrip(container: HTMLElement, data: { categories?: unknown[] } | unknown[]): void {
  if (!container || !data) return;

  // Remove existing strip
  const existing = container.parentElement?.querySelector('.featured-strip');
  if (existing) existing.remove();

  // Collect recommended links from data
  const featured: FeaturedItem[] = [];
  const cats = (data as { categories?: unknown[] }).categories || data;
  if (!Array.isArray(cats)) return;

  for (const cat of cats) {
    const subs = (cat as Record<string, unknown>).subcategories || (cat as Record<string, unknown>).links || [];
    for (const sub of subs as Record<string, unknown>[]) {
      const links = (sub.links || []) as Record<string, unknown>[];
      for (const link of links) {
        if (link.recommended && link.name) {
          featured.push({ name: link.name as string, url: link.url as string, icon: (link.icon as string) || '' });
        }
      }
    }
    // Direct links in category
    if (Array.isArray((cat as Record<string, unknown>).links)) {
      for (const link of (cat as Record<string, unknown>).links as Record<string, unknown>[]) {
        if (link.recommended && link.name) {
          featured.push({ name: link.name as string, url: link.url as string, icon: (link.icon as string) || '' });
        }
      }
    }
  }

  if (!featured.length) return;

  // Limit to 15
  const items = featured.slice(0, 15);

  const strip = document.createElement('div');
  strip.className = 'featured-strip';

  const title = document.createElement('div');
  title.className = 'featured-strip-title';
  title.textContent = t('featured.title');
  strip.appendChild(title);

  const list = document.createElement('div');
  list.className = 'featured-strip-list';
  list.setAttribute('role', 'list');

  items.forEach(item => {
    const a = document.createElement('a');
    a.className = 'featured-strip-item';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');

    if (item.icon) {
      const img = document.createElement('img');
      img.src = item.icon;
      img.alt = '';
      img.width = 16;
      img.height = 16;
      img.loading = 'lazy';
      img.onerror = () => {
        img.src = 'icon/fallback.svg';
      };
      a.appendChild(img);
    }

    a.appendChild(document.createTextNode(item.name));
    list.appendChild(a);
  });

  strip.appendChild(list);

  // Insert before links-container but after filter bars
  const quickBar = container.parentElement?.querySelector('.quick-filter-bar');
  const insertRef = quickBar;
  if (insertRef) {
    insertRef.insertAdjacentElement('afterend', strip);
  } else {
    container.parentElement!.insertBefore(strip, container);
  }

  // Hide when search is active
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (input) {
    const toggle = (): void => {
      strip.hidden = input.value.trim().length > 0;
    };
    input.addEventListener('input', toggle);
    toggle();
  }

  // Language change
  window.addEventListener('langchange', () => {
    title.textContent = t('featured.title');
  });
}

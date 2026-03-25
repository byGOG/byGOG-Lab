/**
 * Featured tools strip — shows top recommended tools at the top of the page.
 */
import { t } from './i18n.js';

/**
 * Render the featured tools strip.
 * @param {HTMLElement} container - #links-container
 * @param {object} data - Full links data (categories array)
 */
export function renderFeaturedStrip(container, data) {
  if (!container || !data) return;

  // Remove existing strip
  const existing = container.parentElement?.querySelector('.featured-strip');
  if (existing) existing.remove();

  // Collect recommended links from data
  const featured = [];
  const cats = data.categories || data;
  if (!Array.isArray(cats)) return;

  for (const cat of cats) {
    const subs = cat.subcategories || cat.links || [];
    for (const sub of subs) {
      const links = sub.links || [];
      for (const link of links) {
        if (link.recommended && link.name) {
          featured.push({ name: link.name, url: link.url, icon: link.icon || '' });
        }
      }
    }
    // Direct links in category
    if (Array.isArray(cat.links)) {
      for (const link of cat.links) {
        if (link.recommended && link.name) {
          featured.push({ name: link.name, url: link.url, icon: link.icon || '' });
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
    container.parentElement.insertBefore(strip, container);
  }

  // Hide when search is active
  const input = document.getElementById('search-input');
  if (input) {
    const toggle = () => {
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

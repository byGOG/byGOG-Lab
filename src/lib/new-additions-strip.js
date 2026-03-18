/**
 * New additions strip — shows recently added tools for returning users.
 * Uses the new-badge system to detect new links.
 */
import { t } from './i18n.js';

/**
 * Render the new additions strip.
 * Call AFTER updateKnownLinks() and after all categories are loaded.
 * @param {HTMLElement} container - #links-container
 */
export function renderNewAdditionsStrip(container) {
  if (!container) return;

  // Remove existing strip
  const existing = container.parentElement?.querySelector('.new-additions-strip');
  if (existing) existing.remove();

  // Find all <li> elements with a .new-badge child
  const newItems = [];
  container.querySelectorAll('.category-card li .new-badge').forEach(badge => {
    const li = badge.closest('li');
    if (!li) return;
    const name = li.dataset.nameOriginal || '';
    const a = li.querySelector('a[href]');
    const url = a ? a.href : '';
    const img = li.querySelector('.icon-wrapper img');
    const icon = img ? img.getAttribute('data-src') || img.src || '' : '';
    if (name && url) {
      newItems.push({ name, url, icon });
    }
  });

  if (!newItems.length) return;

  const strip = document.createElement('div');
  strip.className = 'new-additions-strip';

  const title = document.createElement('div');
  title.className = 'new-additions-strip-title';
  title.textContent = t('newAdditions.title');
  strip.appendChild(title);

  const list = document.createElement('div');
  list.className = 'new-additions-strip-list';
  list.setAttribute('role', 'list');

  newItems.forEach(item => {
    const a = document.createElement('a');
    a.className = 'new-additions-strip-item';
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

  // Insert at the top, before featured strip and other strips
  const featuredStrip = container.parentElement?.querySelector('.featured-strip');
  const recentStrip = container.parentElement?.querySelector('.recent-strip');
  const insertRef = featuredStrip || recentStrip || container;
  container.parentElement.insertBefore(strip, insertRef);

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
    title.textContent = t('newAdditions.title');
  });
}

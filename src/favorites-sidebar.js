/**
 * Favorites Sidebar Renderer
 * Extracted from renderLinks.js to keep it focused on orchestration.
 *
 * Usage:
 *   import { renderSidebar, toggleFavorite } from './favorites-sidebar.js';
 *   renderSidebar(cachedData, favorites, createLinkItem, onSidebarChange);
 *   toggleFavorite(name, favorites, saveFavorites, () => renderSidebar(...));
 */

import { getCategoryIcon } from './lib/category-icons.js';

// Tracks sidebar visibility state between calls to detect layout changes
let lastFavoritesVisible = null;

/**
 * Render (or update) the favorites sidebar.
 * @param {object|null} cachedData - Full link dataset (categories array)
 * @param {Set<string>} favorites - Current favorites set
 * @param {Function} createLinkItem - Factory that builds a <li> for a link object
 * @param {Function} [onSidebarChange] - Called when sidebar visibility changes (e.g. reinit nav)
 */
export function renderSidebar(cachedData, favorites, createLinkItem, onSidebarChange) {
  const favSidebar = document.getElementById('favorites-sidebar');
  if (!favSidebar || !cachedData) return;

  const allLinks = [];
  cachedData.categories.forEach(c => {
    if (c.links) allLinks.push(...c.links);
    if (c.subcategories) c.subcategories.forEach(s => allLinks.push(...s.links));
  });

  const myFavs = allLinks.filter(x => favorites.has(x.name));
  const hasFavorites = myFavs.length > 0;

  if (hasFavorites) {
    favSidebar.classList.remove('sidebar-hidden');
    favSidebar.classList.add('sidebar-visible');

    const favCat = { title: "Favorilerim", links: myFavs };
    let card = favSidebar.querySelector(".category-card");
    let h2 = card ? card.querySelector("h2") : null;
    let ul = card ? card.querySelector("ul") : null;

    if (!card) {
      card = document.createElement("div");
      card.className = "category-card";
      h2 = document.createElement("h2");
      card.appendChild(h2);
      ul = document.createElement("ul");
      card.appendChild(ul);
      favSidebar.appendChild(card);
    } else {
      if (!h2) {
        h2 = document.createElement("h2");
        card.insertBefore(h2, card.firstChild);
      }
      if (!ul) {
        ul = document.createElement("ul");
        card.appendChild(ul);
      } else {
        ul.innerHTML = "";
      }
    }

    h2.innerHTML = "";
    const iconSvg = getCategoryIcon(favCat.title);
    if (iconSvg) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "category-icon";
      iconSpan.innerHTML = iconSvg;
      h2.appendChild(iconSpan);
    }
    const titleSpan = document.createElement("span");
    titleSpan.textContent = favCat.title;
    h2.appendChild(titleSpan);

    favCat.links.sort((a, b) => String(a.name).localeCompare(b.name, "tr"));
    favCat.links.forEach(item => {
      const li = createLinkItem(item);
      ul.appendChild(li);
    });

    try {
      favSidebar.querySelectorAll('img[data-src]').forEach(img => {
        const src = img.getAttribute('data-src');
        if (src) { img.src = src; img.removeAttribute('data-src'); }
      });
    } catch { }
  } else {
    favSidebar.classList.remove('sidebar-visible');
    favSidebar.classList.add('sidebar-hidden');
    favSidebar.innerHTML = '';
  }

  if (lastFavoritesVisible === null) {
    lastFavoritesVisible = hasFavorites;
  } else if (lastFavoritesVisible !== hasFavorites) {
    lastFavoritesVisible = hasFavorites;
    if (onSidebarChange) onSidebarChange();
  }
}

/**
 * Toggle a link's favorite state, update all matching buttons, and re-render sidebar.
 * Mutates the `favorites` Set in place.
 * @param {string} name - Link name
 * @param {Set<string>} favorites - Mutable favorites set
 * @param {Function} saveFavorites - Persist favorites to storage
 * @param {Function} onToggle - Called after toggle (use to re-render sidebar)
 */
export function toggleFavorite(name, favorites, saveFavorites, onToggle) {
  const isFav = favorites.has(name);
  if (isFav) favorites.delete(name);
  else favorites.add(name);

  saveFavorites();

  const allBtns = document.querySelectorAll(`.fav-btn[data-name="${name.replace(/"/g, '\\"')}"]`);
  allBtns.forEach(btn => {
    if (isFav) btn.classList.remove('active');
    else btn.classList.add('active');
  });

  if (onToggle) onToggle();
}

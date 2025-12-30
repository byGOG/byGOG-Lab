import { initBackToTop } from "./back-to-top.js";
import { initCategoryNav } from "./category-nav.js";

// Import from modular libraries
import { fetchLinks, isLinksIndex } from "./lib/data-fetcher.js";
import { closeActiveTooltip, setActiveTooltip, showBackdrop } from "./lib/tooltip.js";
import { getDomainLabel, getDomainBase, normalizeTag, isSvgIcon, isOfficialLink } from "./lib/domain-utils.js";
import { getCategoryIcon, applyCategoryColumns, THREE_COL_TITLES } from "./lib/category-icons.js";
import { resolveCopyValue, setCopyIconOnButton, copyToClipboard, setupCopyDelegation, COPY_ICON_SHAPES } from "./lib/copy-utils.js";
import { 
  foldForSearch, 
  tokenizeFoldedQuery, 
  createHighlightMeta, 
  applyHighlight,
  createMatchApplier,
  createWorkerSearchEngine,
  createSyncSearchEngine
} from "./lib/search-engine.js";
import { setupPWAInstallUI } from "./lib/pwa-install.js";

// Re-export fetchLinks for external use
export { fetchLinks };
// --- Favorites System ---
const FAV_KEY = "bygog_favs";
const DEFAULT_FAVORITES = [
  "Microsoft Activation Scripts",
  "Office Tool Plus",
  "Snappy Driver Installer",
  "Ninite",
  "Winutil",
  "PowerShell",
  "FMHY",
  "Privacy Guides"
];
let favorites = new Set();
let cachedData = null; // Stored for live sidebar updates
let lastFavoritesVisible = null;
let lazyState = null;
let searchState = null;

function saveFavorites() { localStorage.setItem(FAV_KEY, JSON.stringify([...favorites])); }

(() => {
  let stored = null;
  try { stored = localStorage.getItem(FAV_KEY); } catch { }
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        favorites = new Set(parsed);
        return;
      }
    } catch { }
  }
  favorites = new Set(DEFAULT_FAVORITES);
  try { saveFavorites(); } catch { }
})();

// Sidebar Renderer
function renderSidebar() {
  const favSidebar = document.getElementById('favorites-sidebar');
  if (!favSidebar || !cachedData) return;

  // Allow favorites on mobile; layout is single-column there
  const forceHidden = false;

  const allLinks = [];
  cachedData.categories.forEach(c => {
    if (c.links) allLinks.push(...c.links);
    if (c.subcategories) c.subcategories.forEach(s => allLinks.push(...s.links));
  });

  const myFavs = allLinks.filter(x => favorites.has(x.name));
  const hasFavorites = myFavs.length > 0;

  if (hasFavorites) {
    // Ensure visible
    if (!forceHidden) {
      favSidebar.classList.remove('sidebar-hidden');
      favSidebar.classList.add('sidebar-visible');
    }

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

    // Clear h2 and add icon + title for Favorilerim
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

    // Sort favs
    favCat.links.sort((a, b) => String(a.name).localeCompare(b.name, "tr"));

    favCat.links.forEach(item => {
      const li = createLinkItem(item);
      ul.appendChild(li);
    });

    // Eager-load icons inside favorites to avoid blank placeholders
    try {
      favSidebar.querySelectorAll('img[data-src]').forEach(img => {
        const src = img.getAttribute('data-src');
        if (src) { img.src = src; img.removeAttribute('data-src'); }
      });
    } catch { }
  } else {
    // Hide if empty or forced hidden
    favSidebar.classList.remove('sidebar-visible');
    favSidebar.classList.add('sidebar-hidden');
    favSidebar.innerHTML = '';
  }

  if (lastFavoritesVisible === null) {
    lastFavoritesVisible = hasFavorites;
  } else if (lastFavoritesVisible !== hasFavorites) {
    lastFavoritesVisible = hasFavorites;
    try { initCategoryNav(); } catch { }
  }
}

// Tooltip functionality imported from ./lib/tooltip.js

function toggleFavorite(name, clickedBtn) {
  const isFav = favorites.has(name);
  if (isFav) {
    favorites.delete(name);
  } else {
    favorites.add(name);
  }
  saveFavorites();

  // Update all instances of this button (e.g. in main list and fav list)
  const allBtns = document.querySelectorAll(`.fav-btn[data-name="${name.replace(/"/g, '\\"')}"]`);
  allBtns.forEach(btn => {
    if (isFav) btn.classList.remove('active');
    else btn.classList.add('active');
  });

  // Re-render sidebar live
  renderSidebar();
}

// Copy and domain utilities imported from ./lib/copy-utils.js and ./lib/domain-utils.js

function createLinkItem(link) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = link.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const stopNav = (el) => {
    ["click", "mousedown", "mouseup"].forEach(ev => {
      try { el.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); }, { passive: false }); } catch { }
    });
    // Allow touch to synthesize click on mobile; only stop bubbling.
    ["touchstart", "touchend"].forEach(ev => {
      try { el.addEventListener(ev, e => { e.stopPropagation(); }, { passive: true }); } catch { }
    });
  };

  /*
  if (link.recommended) {
    const star = document.createElement("span");
    star.className = "star";
    star.title = "Önerilen";
    star.setAttribute("aria-label", "Önerilen");
    star.setAttribute("aria-hidden", "true");
    star.textContent = "⭐";
    try { star.removeAttribute("title"); } catch { }
    try { star.removeAttribute("aria-label"); } catch { }
    a.appendChild(star);
  }
  */

  if (link.icon) {
    const wrap = document.createElement("span");
    wrap.className = "icon-wrapper";
    const img = document.createElement("img");
    const svgIcon = isSvgIcon(link.icon);
    img.loading = svgIcon ? "eager" : "lazy";
    img.decoding = "async";
    img.width = 28;
    img.height = 28;
    if (svgIcon) {
      img.src = link.icon;
    } else {
      img.setAttribute('data-src', link.icon);
      img.src = "icon/fallback.svg";
    }
    img.onerror = () => {
      if (img.src && !img.src.endsWith("/icon/fallback.svg") && !img.src.endsWith("icon/fallback.svg")) {
        img.src = "icon/fallback.svg";
      }
    };
    if (link.alt) img.alt = link.alt;
    img.className = "site-icon";
    wrap.appendChild(img);
    a.appendChild(wrap);
  }

  const textCol = document.createElement("div");
  textCol.className = "text-col";

  const text = document.createElement("span");
  text.className = "link-text";
  text.textContent = link.name;
  li.dataset.nameOriginal = link.name || "";
  const domainLabel = getDomainLabel(link.url);
  const official = isOfficialLink(link, domainLabel);
  const titleRow = document.createElement("div");
  titleRow.className = "link-title";
  titleRow.appendChild(text);
  if (official) {
    const badge = document.createElement("span");
    badge.className = "official-badge";
    badge.setAttribute("aria-label", "Resmi kaynak");
    badge.setAttribute("title", "Resmi kaynak");
    badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2l7 3v6c0 4.5-3 8.1-7 9-4-0.9-7-4.5-7-9V5l7-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path><path d="M8.5 12.5l2.5 2.5 4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg><span class="sr-only">Resmi kaynak</span>';
    titleRow.appendChild(badge);
  }
  textCol.appendChild(titleRow);

  a.appendChild(textCol);

  // Favorites Button
  const favBtn = document.createElement("button");
  const isFav = favorites.has(link.name);
  favBtn.className = "fav-btn" + (isFav ? " active" : "");
  favBtn.dataset.name = link.name; // For mass update
  favBtn.title = "Favorilere Ekle/Çıkar";
  favBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
  favBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(link.name, favBtn);
  };
  stopNav(favBtn);
  a.appendChild(favBtn);

  // Create custom-tooltip for info-tooltips.js to enhance
  if (link.description) {
    const tip = document.createElement("span");
    tip.className = "custom-tooltip";

    // Icon (if available)
    if (link.icon) {
      const tipImg = document.createElement("img");
      tipImg.loading = "lazy";
      tipImg.width = 24;
      tipImg.height = 24;
      tipImg.setAttribute("data-src", link.icon);
      tipImg.className = "tip-icon";
      tipImg.onerror = () => { tipImg.src = "icon/fallback.svg"; };
      tip.appendChild(tipImg);
    }

    // Description text
    tip.appendChild(document.createTextNode(link.description));
    a.appendChild(tip);
  }

  try {
    const parts = [];
    if (link.name) parts.push(link.name);
    if (Array.isArray(link.tags) && link.tags.length) parts.push(link.tags.join(" "));
    li.dataset.search = parts.join(" ").toLocaleLowerCase("tr");
    try { if (link.folded) li.dataset.folded = String(link.folded); } catch { }
    if (link.description) li.dataset.descOriginal = link.description;
  } catch { }

  li.appendChild(a);

  const copyValue = resolveCopyValue(link);

  if (copyValue) {
    li.classList.add("has-copy");
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-button";
    const defaultLabel = "Komutu kopyala";
    const successLabel = "Komut kopyalandı";
    const errorLabel = "Komut kopyalanamadı";
    const loadingLabel = "Komut kopyalanıyor";

    const srLabel = document.createElement("span");
    srLabel.className = "sr-only";
    srLabel.textContent = defaultLabel;

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const iconShapes = {
      copy: '<rect x="9" y="9" width="12" height="12" rx="2" ry="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
      success: '<path d="M20 6 10 16l-4-4"></path>',
      error: '<path d="M18 6 6 18"></path><path d="M6 6l12 12"></path>',
      loading: '<circle cx="12" cy="12" r="9" stroke-opacity="0.25"></circle><path d="M21 12a9 9 0 0 0-9-9" stroke-opacity="0.9"></path>'
    };

    const setIcon = name => {
      icon.innerHTML = iconShapes[name] || iconShapes.copy;
    };

    setIcon("copy");

    copyButton.appendChild(icon);
    copyButton.appendChild(srLabel);

    const baseAriaLabel = `${link.name || ""} komutunu kopyala`.trim() || defaultLabel;
    copyButton.setAttribute("aria-label", baseAriaLabel);
    copyButton.title = "Komutu panoya kopyala";

    // Store labels and value for delegated handler
    copyButton.dataset.copy = copyValue;
    copyButton.dataset.labelDefault = defaultLabel;
    copyButton.dataset.labelSuccess = successLabel;
    copyButton.dataset.labelError = errorLabel;
    copyButton.dataset.labelLoading = loadingLabel;
    copyButton.dataset.ariaBase = baseAriaLabel;

    a.appendChild(copyButton);

    // Direct handler to ensure copy always fires (even if delegation is blocked)
    copyButton.addEventListener('click', async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      if (copyButton.disabled) return;

      const defaultLabel = copyButton.dataset.labelDefault || 'Kopyala';
      const successLabel = copyButton.dataset.labelSuccess || 'Kopyalandı';
      const errorLabel = copyButton.dataset.labelError || 'Kopyalanamadı';
      const loadingLabel = copyButton.dataset.labelLoading || 'Kopyalanıyor';
      const baseAriaLabel = copyButton.dataset.ariaBase || defaultLabel;
      const sr = copyButton.querySelector('.sr-only');

      const resetState = (label, className, iconName, ariaLabel) => {
        copyButton.classList.remove('copy-error', 'copied', 'copy-loading');
        if (className) copyButton.classList.add(className);
        if (sr) sr.textContent = label;
        copyButton.setAttribute('aria-label', ariaLabel || label);
        setCopyIconOnButton(copyButton, iconName || 'copy');
        copyButton.disabled = false;
      };

      copyButton.disabled = true;
      copyButton.classList.remove('copy-error', 'copied');
      copyButton.classList.add('copy-loading');
      setCopyIconOnButton(copyButton, 'loading');
      if (sr) sr.textContent = loadingLabel;
      copyButton.setAttribute('aria-label', loadingLabel);

      try {
        const ok = await copyToClipboard(copyButton.dataset.copy || '');
        if (ok) resetState(successLabel, 'copied', 'success');
        else resetState(errorLabel, 'copy-error', 'error');
      } catch {
        resetState(errorLabel, 'copy-error', 'error');
      }

      if (copyButton._resetTimer) clearTimeout(copyButton._resetTimer);
      copyButton._resetTimer = setTimeout(() => {
        resetState(defaultLabel, null, 'copy', baseAriaLabel);
      }, 2000);
    });
  }

  return li;
}

function renderCategoriesLegacy(data, container) {
  cachedData = data; // Cache for sidebar
  const frag = document.createDocumentFragment();

  // Render sidebar initially
  renderSidebar();

  // (The rest of renderCategories logic continues below...)

  data.categories.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";
    // Force 3-column layout specifically for "Sistem/Ofis"
    try {
      const ct = String(cat.title).trim();
      const ctf = (typeof foldForSearch === 'function') ? foldForSearch(ct) : ct.toLocaleLowerCase('tr');
      const ctfn = ctf.replace(/\u0131/g, 'i');
      // Apply 3 columns for selected categories (normalized in TR locale)
      const threeColTitles = new Set([
        'sistem/ofis',
        'sistem araclari & bakim',
        'guvenlik & gizlilik',
        'yazilim & paket yoneticileri'
      ]);
      if (threeColTitles.has(ctfn)) {
        card.classList.add('cols-3');
      }
    } catch { }

    const h2 = document.createElement("h2");
    h2.textContent = cat.title;
    card.appendChild(h2);

    const renderList = (links, parent, catTitle, subTitle) => {
      const ul = document.createElement("ul");
      // Sort inside groups alphabetically (tr): recommended A-Z, others A-Z
      const cmp = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "tr");
      const sorted = links.filter(item => !item?.hidden).sort(cmp);

      sorted.forEach(item => {
        const li = createLinkItem(item);
        try {
          const base = String(li.dataset.search || "");
          const groupTokens = item.recommended ? "önerilen önerilenler" : "diğer diğerleri";
          const catTokens = [catTitle, subTitle].filter(Boolean).join(" ");
          li.dataset.search = `${base} ${groupTokens} ${catTokens}`.trim().toLocaleLowerCase("tr");
        } catch { }
        ul.appendChild(li);
      });
      parent.appendChild(ul);
    };

    if (cat.subcategories) {
      const subWrap = document.createElement("div");
      subWrap.className = "sub-category-container";
      cat.subcategories.forEach(sub => {
        const sc = document.createElement("div");
        sc.className = "sub-category";
        const h3 = document.createElement("h3");
        h3.textContent = sub.title;
        sc.appendChild(h3);
        renderList(sub.links, sc, cat.title, sub.title);
        subWrap.appendChild(sc);
      });
      card.appendChild(subWrap);
    } else if (cat.links) {
      renderList(cat.links, card, cat.title, null);
    }

    frag.appendChild(card);
  });
  container.appendChild(frag);
}

// Category icons and columns imported from ./lib/category-icons.js

function createCategoryCard(title) {
  const card = document.createElement("div");
  card.className = "category-card";
  const h2 = document.createElement("h2");
  
  // Add category icon
  const iconSvg = getCategoryIcon(title);
  if (iconSvg) {
    const iconSpan = document.createElement("span");
    iconSpan.className = "category-icon";
    iconSpan.innerHTML = iconSvg;
    h2.appendChild(iconSpan);
  }
  
  const titleSpan = document.createElement("span");
  titleSpan.textContent = title || "";
  h2.appendChild(titleSpan);
  
  card.appendChild(h2);
  applyCategoryColumns(card, title);
  return card;
}

function renderLinkList(links, parent, catTitle, subTitle) {
  if (!Array.isArray(links)) return;
  const ul = document.createElement("ul");
  const cmp = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "tr");
  const sorted = links.filter(item => !item?.hidden).sort(cmp);

  sorted.forEach(item => {
    const li = createLinkItem(item);
    try {
      const base = String(li.dataset.search || "");
      const groupTokens = item.recommended ? "onerilen onerilenler" : "diger digerleri";
      const catTokens = [catTitle, subTitle].filter(Boolean).join(" ");
      li.dataset.search = `${base} ${groupTokens} ${catTokens}`.trim().toLocaleLowerCase("tr");
    } catch { }
    ul.appendChild(li);
  });
  parent.appendChild(ul);
}

function renderCategoryContent(cat, card) {
  if (!cat) return null;
  const title = cat.title || "";
  const cardEl = card || createCategoryCard(title);
  let h2 = cardEl.querySelector("h2");
  if (!h2) {
    h2 = document.createElement("h2");
    cardEl.textContent = "";
    cardEl.appendChild(h2);
  }
  
  // Clear h2 and add icon + title
  h2.innerHTML = "";
  const iconSvg = getCategoryIcon(title);
  if (iconSvg) {
    const iconSpan = document.createElement("span");
    iconSpan.className = "category-icon";
    iconSpan.innerHTML = iconSvg;
    h2.appendChild(iconSpan);
  }
  const titleSpan = document.createElement("span");
  titleSpan.textContent = title;
  h2.appendChild(titleSpan);
  
  applyCategoryColumns(cardEl, title);

  let node = h2.nextSibling;
  while (node) {
    const next = node.nextSibling;
    node.remove();
    node = next;
  }

  if (Array.isArray(cat.subcategories) && cat.subcategories.length) {
    const subWrap = document.createElement("div");
    subWrap.className = "sub-category-container";
    cat.subcategories.forEach(sub => {
      const sc = document.createElement("div");
      sc.className = "sub-category";
      const h3 = document.createElement("h3");
      h3.textContent = sub.title || "";
      sc.appendChild(h3);
      renderLinkList(sub.links, sc, title, sub.title);
      subWrap.appendChild(sc);
    });
    cardEl.appendChild(subWrap);
  } else if (Array.isArray(cat.links)) {
    renderLinkList(cat.links, cardEl, title, null);
  }

  return cardEl;
}

function renderCategories(data, container) {
  if (!data || !Array.isArray(data.categories)) return;
  renderCategoriesLegacy(data, container);
}

function renderCategoryShells(indexData, container) {
  cachedData = { categories: [] };
  const frag = document.createDocumentFragment();
  renderSidebar();

  const entries = (indexData.categories || []).map((meta, index) => {
    const title = meta?.title || "";
    const card = createCategoryCard(title);
    card.dataset.categoryIndex = String(index);
    if (meta?.file) card.dataset.categoryFile = String(meta.file);
    const loading = document.createElement("div");
    loading.className = "category-loading";
    loading.textContent = "Yukleniyor...";
    card.appendChild(loading);
    frag.appendChild(card);
    cachedData.categories.push({ title });
    return { meta, card, index, loaded: false, loading: false, promise: null };
  });

  container.appendChild(frag);
  return { entries };
}

function initLazyCategories(indexData, container) {
  const state = renderCategoryShells(indexData, container);
  const entries = state.entries;
  const entryByFile = new Map();
  entries.forEach(entry => { if (entry.meta?.file) entryByFile.set(entry.meta.file, entry); });
  state.entryByFile = entryByFile;

  const showLoadError = (card) => {
    if (!card) return;
    let msg = card.querySelector(".category-loading");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "category-loading";
      card.appendChild(msg);
    }
    msg.textContent = "Yuklenemedi.";
  };

  const loadCategory = async (entry) => {
    if (!entry || entry.loaded || entry.loading) return entry?.promise;
    entry.loading = true;
    entry.promise = (async () => {
      try {
        const res = await fetch(entry.meta.file, { cache: "force-cache" });
        if (!res.ok) throw new Error("Category load failed");
        const data = await res.json();
        renderCategoryContent(data, entry.card);
        entry.loaded = true;
        cachedData.categories[entry.index] = data;
        renderSidebar();
        refreshSearchIndex();
        return data;
      } catch {
        showLoadError(entry.card);
        return null;
      } finally {
        entry.loading = false;
      }
    })();
    return entry.promise;
  };

  state.loadCategory = loadCategory;
  state.loadAllPromise = null;
  state.loadAll = async () => {
    if (state.loadAllPromise) return state.loadAllPromise;
    state.loadAllPromise = Promise.all(entries.map(entry => loadCategory(entry))).then(() => {
      refreshSearchIndex();
    });
    return state.loadAllPromise;
  };
  state.allLoaded = () => entries.every(entry => entry.loaded);

  const io = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(obsEntries => {
      obsEntries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx = Number(entry.target.dataset.categoryIndex || "-1");
        const targetEntry = entries[idx];
        if (targetEntry) loadCategory(targetEntry);
        if (io) io.unobserve(entry.target);
      });
    }, { rootMargin: "400px 0px" })
    : null;

  if (io) {
    entries.forEach(entry => io.observe(entry.card));
  } else {
    entries.forEach(entry => loadCategory(entry));
  }

  const warmCount = Math.min(2, entries.length);
  for (let i = 0; i < warmCount; i++) {
    loadCategory(entries[i]);
  }

  const linkIndex = indexData.linkIndex || {};
  const favFiles = new Set([...favorites].map(name => linkIndex[name]).filter(Boolean));
  favFiles.forEach(file => {
    const entry = entryByFile.get(file);
    if (entry) loadCategory(entry);
  });

  lazyState = state;
  return state;
}

function areAllCategoriesLoaded() {
  if (!lazyState) return true;
  if (typeof lazyState.allLoaded === "function") return lazyState.allLoaded();
  return lazyState.entries.every(entry => entry.loaded);
}

function getNavCardFromDetail(detail) {
  if (!detail) return null;
  if (detail.card && detail.card.classList && detail.card.classList.contains("category-card")) return detail.card;
  const slug = detail.slug ? String(detail.slug) : "";
  if (slug) {
    const card = document.querySelector(`.category-card[data-cat-slug="${slug}"]`);
    if (card) return card;
  }
  const id = detail.id ? String(detail.id) : "";
  if (id) return document.querySelector(`.category-card[data-cat-id="${id}"]`);
  return null;
}

function ensureLazyCategoryLoaded(card) {
  if (!lazyState || !card || typeof lazyState.loadCategory !== "function") return;
  const idx = Number(card.dataset.categoryIndex || "-1");
  if (!Number.isFinite(idx) || idx < 0) return;
  const entry = lazyState.entries && lazyState.entries[idx];
  if (!entry) return;
  lazyState.loadCategory(entry);
}

document.addEventListener("category-nav-select", (ev) => {
  try {
    const card = getNavCardFromDetail(ev.detail);
    ensureLazyCategoryLoaded(card);
  } catch { }
});

// Copy utilities imported from ./lib/copy-utils.js

// Search engine utilities imported from ./lib/search-engine.js

function setupSearchLegacy() {
  const input = document.getElementById("search-input");
  const status = document.getElementById("search-status");
  const nodes = Array.from(document.querySelectorAll(".category-card li"));
  if (!input || !status || !nodes.length) return;

  nodes.forEach((el, index) => {
    el.dataset.searchIndex = String(index);
  });

  const dataset = nodes.map((el, index) => {
    const raw = el.dataset.search || el.textContent || "";
    const catEl = el.closest('.category-card');
    const subEl = el.closest('.sub-category');
    return {
      index,
      folded: el.dataset.folded ? String(el.dataset.folded) : foldForSearch(raw),
      isLink: !!el.querySelector(".link-text"),
      catEl,
      subEl
    };
  });

  let engine = null;
  const getEngine = () => {
    if (engine) return engine;
    try {
      engine = createWorkerSearchEngine(nodes, dataset, status) || createSyncSearchEngine(nodes, dataset, status);
    } catch {
      engine = createSyncSearchEngine(nodes, dataset, status);
    }
    return engine;
  };

  let debounceTimer;
  function computeDelay(val) {
    const n = (String(val || "").trim()).length;
    if (n >= 8) return 80;
    if (n >= 4) return 120;
    return 250;
  }

  function runImmediate(value) {
    clearTimeout(debounceTimer);
    getEngine().run(value);
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const delay = computeDelay(input.value);
    debounceTimer = setTimeout(() => {
      try {
        getEngine().run(input.value);
      } catch { engine = createSyncSearchEngine(nodes, dataset, status); engine.run(input.value); }
      try {
        const url = new URL(window.location.href);
        const v = (input.value || "").trim();
        if (v) url.searchParams.set("q", v); else url.searchParams.delete("q");
        history.replaceState(null, "", url.toString());
      } catch { }
    }, delay);
  });

  document.addEventListener("keydown", ev => {
    const t = ev.target;
    const tag = t && t.tagName ? t.tagName.toUpperCase() : "";
    const inEditable = !!(t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(tag)));

    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && (ev.key === "k" || ev.key === "K")) {
      ev.preventDefault();
      input.focus();
      input.select();
      return;
    }

    if (ev.ctrlKey && !ev.altKey && !ev.shiftKey && (ev.key === "e" || ev.key === "E")) {
      ev.preventDefault();
      input.focus();
      input.select();
      return;
    }

    if ((ev.key === "/" || ev.key === ".") && !(ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey)) {
      if (inEditable) return;
      ev.preventDefault();
      input.focus();
      input.select();
    }
  });

  input.addEventListener("keydown", ev => {
    if (ev.key === "Escape") {
      if (input.value) {
        input.value = "";
        runImmediate("");
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("q");
          history.replaceState(null, "", url.toString());
        } catch { }
      }
      ev.stopPropagation();
    } else if (ev.key === "Enter") {
      const q = (input.value || "").trim();
      if (!q) return;
      const firstLink = document.querySelector('.category-card li:not(.is-hidden) a[href]');
      if (firstLink) {
        firstLink.click();
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
  });

  try {
    const urlQ = new URL(window.location.href).searchParams.get("q");
    if (urlQ) {
      input.value = urlQ;
      runImmediate(urlQ);
    } else if (input.value) {
      runImmediate(input.value);
    }
  } catch {
    if (input.value) runImmediate(input.value);
  }

  // Lazy-load icons with IntersectionObserver
  try {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          io.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' }) : null;
    if (io) {
      document.querySelectorAll('img.site-icon[data-src]').forEach(img => io.observe(img));
    }
  } catch { }
}



function buildSearchDataset() {
  const nodes = Array.from(document.querySelectorAll(".category-card li"));
  nodes.forEach((el, index) => {
    el.dataset.searchIndex = String(index);
  });

  const dataset = nodes.map((el, index) => {
    const raw = el.dataset.search || el.textContent || "";
    const catEl = el.closest(".category-card");
    const subEl = el.closest(".sub-category");
    return {
      index,
      folded: el.dataset.folded ? String(el.dataset.folded) : foldForSearch(raw),
      isLink: !!el.querySelector(".link-text"),
      catEl,
      subEl
    };
  });

  return { nodes, dataset };
}

function refreshSearchIndex(options = {}) {
  if (!searchState) return;
  const { nodes, dataset } = buildSearchDataset();
  searchState.nodes = nodes;
  searchState.dataset = dataset;
  if (searchState.engine && searchState.engine.dispose) searchState.engine.dispose();
  searchState.engine = null;

  if (nodes.length) {
    try {
      searchState.engine = createWorkerSearchEngine(nodes, dataset, searchState.status)
        || createSyncSearchEngine(nodes, dataset, searchState.status);
    } catch {
      searchState.engine = createSyncSearchEngine(nodes, dataset, searchState.status);
    }
  }

  if (options.runQuery === false) return;
  const value = searchState.input.value || "";
  if (searchState.engine) {
    searchState.engine.run(value);
  } else if (value.trim()) {
    searchState.status.textContent = "Sonuclar yukleniyor...";
  } else {
    searchState.status.textContent = "";
  }
}

function setupSearch() {
  const input = document.getElementById("search-input");
  const status = document.getElementById("search-status");
  if (!input || !status) return;
  if (searchState) return searchState;

  searchState = {
    input,
    status,
    engine: null,
    nodes: [],
    dataset: []
  };

  refreshSearchIndex({ runQuery: false });

  let debounceTimer;
  function computeDelay(val) {
    const n = (String(val || "").trim()).length;
    if (n >= 8) return 80;
    if (n >= 4) return 120;
    return 250;
  }

  function maybeLoadAll(value) {
    const q = String(value || "").trim();
    if (!q) return false;
    if (!lazyState || areAllCategoriesLoaded()) return false;
    status.textContent = "Sonuclar yukleniyor...";
    if (!lazyState.loadAllPromise) lazyState.loadAllPromise = lazyState.loadAll();
    return true;
  }

  function runImmediate(value) {
    clearTimeout(debounceTimer);
    if (maybeLoadAll(value)) return;
    if (!searchState.engine) refreshSearchIndex({ runQuery: false });
    if (searchState.engine) searchState.engine.run(value);
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const delay = computeDelay(input.value);
    debounceTimer = setTimeout(() => {
      if (maybeLoadAll(input.value)) {
        try {
          const url = new URL(window.location.href);
          const v = (input.value || "").trim();
          if (v) url.searchParams.set("q", v); else url.searchParams.delete("q");
          history.replaceState(null, "", url.toString());
        } catch { }
        return;
      }
      if (!searchState.engine) refreshSearchIndex({ runQuery: false });
      try {
        if (searchState.engine) searchState.engine.run(input.value);
      } catch {
        refreshSearchIndex({ runQuery: true });
      }
      try {
        const url = new URL(window.location.href);
        const v = (input.value || "").trim();
        if (v) url.searchParams.set("q", v); else url.searchParams.delete("q");
        history.replaceState(null, "", url.toString());
      } catch { }
    }, delay);
  });

  document.addEventListener("keydown", ev => {
    const t = ev.target;
    const tag = t && t.tagName ? t.tagName.toUpperCase() : "";
    const inEditable = !!(t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(tag)));

    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && (ev.key === "k" || ev.key === "K")) {
      ev.preventDefault();
      input.focus();
      input.select();
      return;
    }

    if (ev.ctrlKey && !ev.altKey && !ev.shiftKey && (ev.key === "e" || ev.key === "E")) {
      ev.preventDefault();
      input.focus();
      input.select();
      return;
    }

    if ((ev.key === "/" || ev.key === ".") && !(ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey)) {
      if (inEditable) return;
      ev.preventDefault();
      input.focus();
      input.select();
    }
  });

  input.addEventListener("keydown", ev => {
    if (ev.key === "Escape") {
      if (input.value) {
        input.value = "";
        runImmediate("");
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("q");
          history.replaceState(null, "", url.toString());
        } catch { }
      }
      ev.stopPropagation();
    } else if (ev.key === "Enter") {
      const q = (input.value || "").trim();
      if (!q) return;
      const firstLink = document.querySelector(".category-card li:not(.is-hidden) a[href]");
      if (firstLink) {
        firstLink.click();
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
  });

  try {
    const urlQ = new URL(window.location.href).searchParams.get("q");
    if (urlQ) {
      input.value = urlQ;
      if (!maybeLoadAll(urlQ)) runImmediate(urlQ);
    } else if (input.value) {
      runImmediate(input.value);
    }
  } catch {
    if (input.value) runImmediate(input.value);
  }

  return searchState;
}

function setupThemeToggle() {
  try { const c = document.querySelector('.theme-toggle-container'); if (c) c.remove(); } catch { }
  try { document.body.classList.add('koyu'); } catch { }
  return;
  const btn = document.getElementById("theme-toggle");
  const body = document.body;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function apply(isDark) {
    const dark = !!isDark;
    if (dark) {
      body.classList.add("koyu");
      btn.textContent = "☀️";
      btn.setAttribute("aria-label", "Aydınlık temaya geç");
    } else {
      body.classList.remove("koyu");
      btn.textContent = "🌙";
      btn.setAttribute("aria-label", "Koyu temaya geç");
    }
    btn.setAttribute("aria-pressed", String(dark));
  }

  btn.addEventListener("click", () => {
    const willDark = !body.classList.contains("koyu");
    apply(willDark);
    localStorage.setItem("theme", willDark ? "koyu" : "aydinlik");
  });

  let pref = localStorage.getItem("theme");
  if (!pref) pref = prefersDark.matches ? "koyu" : "aydinlik";
  apply(pref === "koyu");
  prefersDark.addEventListener("change", e => {
    if (!localStorage.getItem("theme")) apply(e.matches);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupThemeToggle();
  // Focus search input immediately on desktop for instant typing
  try {
    const input = document.getElementById("search-input");
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (input && !isMobile) { input.focus(); input.select(); }
    if (input) {
      const clearOverlays = () => {
        closeActiveTooltip();
        try {
          const overlay = document.getElementById('info-overlay');
          const fly = document.getElementById('global-info-flyout');
          if (overlay) { overlay.classList.remove('show'); overlay.setAttribute('aria-hidden', 'true'); }
          if (fly) { fly.classList.remove('show'); fly.setAttribute('aria-hidden', 'true'); }
          document.body.classList.remove('modal-open');
        } catch {}
      };
      try { input.addEventListener('focus', clearOverlays); } catch {}
      try { input.addEventListener('pointerdown', clearOverlays); } catch {}
    }
  } catch { }
  const container = document.getElementById("links-container");
  try {
    const result = await fetchLinks();
    if (result && result.mode === "index") {
      initLazyCategories(result.data, container);
    } else if (result && result.data) {
      renderCategories(result.data, container);
    } else {
      renderCategories(result, container);
    }
    initCategoryNav();
    initBackToTop();
  } catch (err) {
    container.textContent = "Bağlantılar yüklenemedi.";
    console.error(err);
  }
  setupCopyDelegation(document.getElementById('links-container'));
  setupSearch();
  setupPWAInstallUI();
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      closeActiveTooltip();
    }
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      let hadController = !!navigator.serviceWorker.controller;
      let bannerShown = false;
      let lastReg = null;

      const showUpdateBanner = () => {
        if (bannerShown) return;
        bannerShown = true;
        try {
          let bar = document.getElementById('sw-update-banner');
          if (!bar) {
            bar = document.createElement('div');
            bar.id = 'sw-update-banner';
            bar.className = 'update-banner';
            bar.setAttribute('role', 'status');
            bar.setAttribute('aria-live', 'polite');

            const msg = document.createElement('span');
            msg.className = 'update-banner-text';
            msg.textContent = 'Yeni sürüm hazır';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'update-banner-action';
            btn.textContent = 'Yenile';
            btn.setAttribute('aria-label', 'Sayfayı yenile');
            btn.addEventListener('click', () => {
              try { if (lastReg && lastReg.waiting) lastReg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch { }
              window.location.reload();
            });

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'update-banner-close';
            close.setAttribute('aria-label', 'Kapat');
            close.innerHTML = '×';
            close.addEventListener('click', () => { try { bar.remove(); } catch { } });

            bar.appendChild(msg);
            bar.appendChild(btn);
            bar.appendChild(close);
            document.body.appendChild(bar);
          } else {
            bar.style.display = '';
          }
        } catch { }
      };

      navigator.serviceWorker.register("sw.js", { scope: "./", updateViaCache: "none" }).then(
        reg => {
          lastReg = reg;
          console.log("ServiceWorker registration successful with scope:", reg.scope);
          try {
            setInterval(() => {
              reg.update().catch(() => {});
            }, 60 * 60 * 1000);
          } catch { }
          try {
            if ("periodicSync" in reg) {
              reg.periodicSync.register("update-content", {
                minInterval: 24 * 60 * 60 * 1000
              }).catch(() => {});
            }
          } catch { }
          try {
            // If a new worker is found and installed while a controller exists, show banner
            reg.addEventListener('updatefound', () => {
              const inst = reg.installing;
              if (!inst) return;
              inst.addEventListener('statechange', () => {
                if (inst.state === 'installed' && navigator.serviceWorker.controller && hadController) {
                  showUpdateBanner();
                }
              });
            });
            // Also, if there is already a waiting worker (rare with skipWaiting), show banner
            if (reg.waiting && navigator.serviceWorker.controller && hadController) showUpdateBanner();
          } catch { }
        },
        err => console.log("ServiceWorker registration failed:", err)
      );

      // When a new SW takes control, offer refresh instead of auto-reload
      try {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!hadController) { hadController = true; return; }
          showUpdateBanner();
        });
      } catch { }
    });
  }
});

// PWA install UI imported from ./lib/pwa-install.js

import { initBackToTop } from "./back-to-top.js";
import { initCategoryNav } from "./category-nav.js";

const LINKS_INDEX_PATH = "data/links-index.json";
const LINKS_FALLBACK_PATH = "links.json";

function isLinksIndex(data) {
  return !!(data && Array.isArray(data.categories) && data.categories.every(cat => typeof cat?.file === "string"));
}

export async function fetchLinks() {
  try {
    const res = await fetch(LINKS_INDEX_PATH, { cache: "force-cache" });
    if (res.ok) {
      const data = await res.json();
      if (isLinksIndex(data)) return { mode: "index", data };
      return { mode: "full", data };
    }
  } catch { }
  return { mode: "full", data: await fetchLinksLegacy() };
}

async function fetchLinksLegacy() {
  const res = await fetch(LINKS_FALLBACK_PATH);
  if (!res.ok) throw new Error("links.json yüklenemedi");
  return res.json();
}
// --- Favorites System ---
const FAV_KEY = "bygog_favs";
const DEFAULT_FAVORITES = [
  "Microsoft Activation Scripts",
  "Office Tool Plus",
  "Snappy Driver Installer",
  "Ninite",
  "Winutil",
  "PowerShell",
  "FMHY"
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

// --- Global Backdrop & Tooltip Focus Mode ---
let activeTooltip = null;
let activeItem = null;

const backdrop = document.createElement('div');
backdrop.id = 'tooltip-backdrop';
document.body.appendChild(backdrop);

backdrop.onclick = () => {
  closeActiveTooltip();
};

// Close stray tooltips when clicking anywhere outside
document.addEventListener('click', e => {
  if (!activeTooltip) return;
  const t = e.target;
  try {
    // Keep open if the click is inside the tooltip or on an info button
    if (activeTooltip.contains(t) || (t.closest && t.closest('button.info-button'))) return;
  } catch {}
  closeActiveTooltip();
});

function closeActiveTooltip() {
  if (activeTooltip) {
    activeTooltip.classList.remove('visible');
    activeTooltip = null;
  }
  backdrop.classList.remove('visible');
}


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

const WINUTIL_COMMAND = 'irm "https://christitus.com/win" | iex';

function resolveCopyValue(link) {
  if (link && link.copyText) return String(link.copyText);
  const name = String(link?.name || "").toLocaleLowerCase("tr");
  const url = String(link?.url || "");
  if (name === "winutil" || url.includes("christitus.com/win")) {
    return WINUTIL_COMMAND;
  }
  return "";
}

const MULTI_PART_TLDS = new Set([
  "com.tr",
  "org.tr",
  "net.tr",
  "gov.tr",
  "edu.tr",
  "bel.tr",
  "k12.tr",
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "org.au",
  "com.br",
  "com.mx",
  "com.ar",
  "com.co",
  "com.cl",
  "com.pe",
  "co.jp",
  "co.kr",
  "co.nz",
  "co.in",
  "com.sa",
  "com.sg"
]);

function getDomainLabel(url) {
  if (!url) return "";
  try {
    const parsed = new URL(String(url));
    let host = String(parsed.hostname || "").toLowerCase();
    if (!host) return "";
    if (host.startsWith("www.")) host = host.slice(4);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    const tail2 = parts.slice(-2).join(".");
    if (MULTI_PART_TLDS.has(tail2)) return parts.slice(-3).join(".");
    return tail2;
  } catch {
    return "";
  }
}

const SORTED_MULTI_TLDS = Array.from(MULTI_PART_TLDS).sort((a, b) => b.length - a.length);

function getDomainBase(label) {
  if (!label) return "";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(label)) return label;
  for (const tld of SORTED_MULTI_TLDS) {
    const suffix = `.${tld}`;
    if (label.endsWith(suffix)) {
      return label.slice(0, -suffix.length);
    }
  }
  const idx = label.lastIndexOf(".");
  return idx > 0 ? label.slice(0, idx) : label;
}

function normalizeTag(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

function isSvgIcon(value) {
  return /\.svg(?:[?#].*)?$/i.test(String(value || ""));
}

function isOfficialLink(link, domainLabel) {
  if (link && (link.official === true || String(link.official).toLowerCase() === "true")) {
    return true;
  }
  if (!domainLabel) return false;
  const base = normalizeTag(getDomainBase(domainLabel));
  if (!base) return false;
  const tags = Array.isArray(link?.tags) ? link.tags : [];
  return tags.some(tag => normalizeTag(tag) === base);
}

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
  favBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z"></path></svg>';
  favBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(link.name, favBtn);
  };
  stopNav(favBtn);
  a.appendChild(favBtn);

  if (link.description) {
    li.classList.add("has-info");


    const tip = document.createElement("span");
    tip.className = "custom-tooltip";

    // 1. Icon (if available)
    if (link.icon) {
      const tipImg = document.createElement("img");
      tipImg.loading = "lazy";
      tipImg.width = 24;
      tipImg.height = 24;
      tipImg.src = link.icon;
      tipImg.className = "tip-icon";
      tipImg.onerror = () => { tipImg.src = "icon/fallback.svg"; };
      tip.appendChild(tipImg);
    }

    // 2. Title (Name)
    const tipTitle = document.createElement("strong");
    tipTitle.className = "tip-title";
    tipTitle.textContent = link.name;
    tip.appendChild(tipTitle);

    // 3. Description
    const tipDesc = document.createElement("span");
    tipDesc.className = "tip-desc";
    tipDesc.textContent = link.description;
    tip.appendChild(tipDesc);

    // Create Info Button referencing the tip variable directly
    const infoBtn = document.createElement("button");
    infoBtn.className = "info-button";
    infoBtn.type = "button";
    infoBtn.title = "Bilgi";
    infoBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    infoBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isVisible = tip.classList.contains('visible');

      // Close any active tooltip (including this one if it's open)
      closeActiveTooltip(); // This clears activeTooltip, activeItem, and hides backdrop

      // If it wasn't visible before, open it now
      if (!isVisible) {
        // Move tooltip to body to avoid stacking/overflow issues
        if (!tip._movedToBody) {
          document.body.appendChild(tip);
          tip._movedToBody = true;
        }
        tip.classList.add('visible');
        activeTooltip = tip;

        backdrop.classList.add('visible');
      }
    };
    stopNav(infoBtn);
    a.appendChild(infoBtn);
    a.appendChild(tip);
    // Lazy-load tooltip image on demand (hover/focus)
    const loadTipImg = () => {
      try {
        const ti = tip.querySelector('img[data-src]');
        if (ti) { ti.src = ti.getAttribute('data-src'); ti.removeAttribute('data-src'); }
      } catch { }
    };
    // Load when hovering/focusing the name or info button for better intent matching
    try { text.addEventListener('mouseenter', loadTipImg, { once: true }); } catch { }
    try { infoBtn.addEventListener('mouseenter', loadTipImg, { once: true }); } catch { }
    try { text.addEventListener('focusin', loadTipImg, { once: true }); } catch { }
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

const THREE_COL_TITLES = new Set([
  "sistem/ofis",
  "sistem araclari & bakim",
  "guvenlik & gizlilik",
  "yazilim & paket yoneticileri"
]);

// Category icons mapping
const CATEGORY_ICONS = {
  "sistem/ofis": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
  "sistem araclari & bakim": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  "guvenlik & gizlilik": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  "yazilim & paket yoneticileri": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  "internet & tarayici": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  "medya & indirme": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  "gelistirici & tasarim": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  "uygulamalar & araclar": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  "mobil & iletisim": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  "oyun": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
  "favorilerim": `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
};

function getCategoryIcon(title) {
  if (!title) return null;
  const normalized = String(title).trim().toLocaleLowerCase("tr")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
  return CATEGORY_ICONS[normalized] || null;
}

function applyCategoryColumns(card, title) {
  if (!card) return;
  try {
    const ct = String(title || "").trim();
    const ctf = (typeof foldForSearch === "function") ? foldForSearch(ct) : ct.toLocaleLowerCase("tr");
    const ctfn = ctf.replace(/\u0131/g, "i");
    if (THREE_COL_TITLES.has(ctfn)) card.classList.add("cols-3");
    else card.classList.remove("cols-3");
  } catch { }
}

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

const COPY_ICON_SHAPES = {
  copy: '<rect x="9" y="9" width="12" height="12" rx="2" ry="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
  success: '<path d="M20 6 10 16l-4-4"></path>',
  error: '<path d="M18 6 6 18"></path><path d="M6 6l12 12"></path>',
  loading: '<circle cx="12" cy="12" r="9" stroke-opacity="0.25"></circle><path d="M21 12a9 9 0 0 0-9-9" stroke-opacity="0.9"></path>'
};

function setCopyIconOnButton(btn, name) {
  const svg = btn.querySelector('svg');
  if (svg) svg.innerHTML = COPY_ICON_SHAPES[name] || COPY_ICON_SHAPES.copy;
}

async function copyToClipboard(text) {
  const fallback = () => {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(temp);
    return ok;
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try { return fallback(); } catch { return false; }
    }
  }
  try { return fallback(); } catch { return false; }
}

function setupCopyDelegation() {
  const container = document.getElementById('links-container');
  if (!container || container.dataset.copyDelegation === 'on') return;
  container.dataset.copyDelegation = 'on';
  container.addEventListener('click', async ev => {
    const target = ev.target;
    if (!target || !target.closest) return;
    const btn = target.closest('button.copy-button');
    if (!btn || !container.contains(btn)) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (btn.disabled) return;

    const defaultLabel = btn.dataset.labelDefault || 'Kopyala';
    const successLabel = btn.dataset.labelSuccess || 'Kopyalandı';
    const errorLabel = btn.dataset.labelError || 'Kopyalanamadı';
    const loadingLabel = btn.dataset.labelLoading || 'Kopyalanıyor';
    const baseAriaLabel = btn.dataset.ariaBase || defaultLabel;
    const sr = btn.querySelector('.sr-only');

    const resetState = (label, className, iconName, ariaLabel) => {
      btn.classList.remove('copy-error', 'copied', 'copy-loading');
      if (className) btn.classList.add(className);
      if (sr) sr.textContent = label;
      btn.setAttribute('aria-label', ariaLabel || label);
      setCopyIconOnButton(btn, iconName || 'copy');
      btn.disabled = false;
    };

    btn.disabled = true;
    btn.classList.remove('copy-error', 'copied');
    btn.classList.add('copy-loading');
    setCopyIconOnButton(btn, 'loading');
    if (sr) sr.textContent = loadingLabel;
    btn.setAttribute('aria-label', loadingLabel);

    try {
      const ok = await copyToClipboard(btn.dataset.copy || '');
      if (ok) resetState(successLabel, 'copied', 'success');
      else resetState(errorLabel, 'copy-error', 'error');
    } catch {
      resetState(errorLabel, 'copy-error', 'error');
    }

    if (btn._resetTimer) clearTimeout(btn._resetTimer);
    btn._resetTimer = setTimeout(() => {
      resetState(defaultLabel, null, 'copy', baseAriaLabel);
    }, 2000);
  });
}

const SEARCH_LOCALE = "tr";
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

function normalizeForSearch(value) {
  return String(value || "").toLocaleLowerCase(SEARCH_LOCALE);
}

function foldForSearch(value) {
  // Turkish-friendly folding: remove diacritics and unify dotless i -> i
  return normalizeForSearch(value)
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .replace(/ı/g, "i");
}

function tokenizeFoldedQuery(value) {
  return foldForSearch(value).split(/\s+/).filter(Boolean);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\$&");
}

function buildHighlightRegex(value) {
  const tokens = normalizeForSearch(value).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  return new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
}

function createHighlightMeta(value) {
  const hasQuery = value.trim().length > 0;
  return {
    raw: value,
    hasQuery,
    regex: hasQuery ? buildHighlightRegex(value) : null
  };
}

function applyHighlight(node, _regex) {
  const label = node.querySelector(".link-text");
  if (label) {
    const original = node.dataset.nameOriginal || label.textContent || "";
    label.textContent = original;
  }
  const tip = node.querySelector(".custom-tooltip");
  if (tip) {
    const descOriginal = node.dataset.descOriginal || "";
    if (descOriginal) {
      const img = tip.querySelector("img");
      // Rebuild tooltip content without any highlighting
      try {
        tip.innerHTML = "";
        if (img) {
          tip.appendChild(img);
          tip.appendChild(document.createTextNode(" "));
        }
        tip.appendChild(document.createTextNode(descOriginal));
      } catch {
        // Fallback: set plain text
        tip.textContent = descOriginal;
      }
    }
  }
}

// Category visibility is managed via counters for performance
// Toggling happens in createMatchApplier using 'is-hidden' class
function updateCategoryVisibility() { }

function createMatchApplier(nodes, dataset, status) {
  const visible = new Set(dataset.map(entry => entry.index));
  const catCounts = new Map();
  const subCounts = new Map();
  dataset.forEach(entry => {
    if (!entry.isLink) return;
    const cat = entry.catEl;
    const sub = entry.subEl;
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
    if (sub) subCounts.set(sub, (subCounts.get(sub) || 0) + 1);
  });

  function toggleContainer(el, countMap) {
    if (!el) return;
    const count = countMap.get(el) || 0;
    el.classList.toggle('is-hidden', count <= 0);
  }

  function hideIndex(idx) {
    const node = nodes[idx];
    if (!node) return;
    if (!node.classList.contains('is-hidden')) {
      node.classList.add('is-hidden');
      applyHighlight(node, null);
      const entry = dataset[idx];
      if (entry.isLink) {
        const cat = entry.catEl; const sub = entry.subEl;
        if (cat) { catCounts.set(cat, (catCounts.get(cat) || 0) - 1); toggleContainer(cat, catCounts); }
        if (sub) { subCounts.set(sub, (subCounts.get(sub) || 0) - 1); toggleContainer(sub, subCounts); }
      }
    }
    visible.delete(idx);
  }

  function showIndex(idx, regex) {
    const node = nodes[idx];
    if (!node) return false;
    let wasHidden = node.classList.contains('is-hidden');
    if (wasHidden) {
      node.classList.remove('is-hidden');
      const entry = dataset[idx];
      if (entry.isLink) {
        const cat = entry.catEl; const sub = entry.subEl;
        if (cat) { catCounts.set(cat, (catCounts.get(cat) || 0) + 1); toggleContainer(cat, catCounts); }
        if (sub) { subCounts.set(sub, (subCounts.get(sub) || 0) + 1); toggleContainer(sub, subCounts); }
      }
      visible.add(idx);
    }
    applyHighlight(node, regex);
    return dataset[idx].isLink;
  }

  return function applyMatches(meta, matches) {
    const matchSet = new Set(matches);
    const toHide = [];
    visible.forEach(idx => { if (!matchSet.has(idx)) toHide.push(idx); });
    toHide.forEach(hideIndex);

    let matchCount = 0;
    matchSet.forEach(idx => { if (showIndex(idx, meta.regex)) matchCount++; });

    if (meta.hasQuery) {
      status.textContent = matchCount > 0 ? `${matchCount} sonuç bulundu` : "Sonuç bulunamadı";
    } else {
      status.textContent = "";
    }
  };
}

function createWorkerSearchEngine(nodes, dataset, status) {
  if (typeof window === "undefined" || typeof window.Worker === "undefined") return null;
  let worker;
  try {
    worker = new Worker(new URL("./searchWorker.js", import.meta.url), { type: "module" });
  } catch (err) {
    console.warn("Search worker could not start:", err);
    return null;
  }
  const applyMatches = createMatchApplier(nodes, dataset, status);
  const pending = new Map();
  let lastQueryId = 0;
  let latestApplied = 0;

  worker.postMessage({ type: "seed", payload: dataset.map(entry => ({ index: entry.index, folded: entry.folded })) });

  worker.addEventListener("message", event => {
    const { type, payload } = event.data || {};
    if (type !== "result" || !payload) return;
    const { id, matches } = payload;
    const meta = pending.get(id);
    pending.delete(id);
    if (!meta || id < latestApplied) return;
    latestApplied = id;
    applyMatches(meta, matches || []);
  });

  return {
    run(query) {
      const meta = createHighlightMeta(query);
      const tokens = tokenizeFoldedQuery(query);
      if (!tokens.length) {
        const matches = dataset.map(entry => entry.index);
        applyMatches(meta, matches);
        return;
      }
      const id = ++lastQueryId;
      pending.set(id, meta);
      worker.postMessage({ type: "query", payload: { id, value: query } });
    },
    dispose() {
      try { worker.terminate(); } catch { }
    }
  };
}

function createSyncSearchEngine(nodes, dataset, status) {
  const applyMatches = createMatchApplier(nodes, dataset, status);
  return {
    run(query) {
      const meta = createHighlightMeta(query);
      const tokens = tokenizeFoldedQuery(query);
      const matches = !tokens.length
        ? dataset.map(entry => entry.index)
        : dataset
          .filter(entry => tokens.every(token => entry.folded.includes(token)))
          .map(entry => entry.index);
      applyMatches(meta, matches);
    },
    dispose() { }
  };
}

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
  setupCopyDelegation();
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

      navigator.serviceWorker.register("sw.js").then(
        reg => {
          lastReg = reg;
          console.log("ServiceWorker registration successful with scope:", reg.scope);
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

// PWA install prompt handling and UI
function setupPWAInstallUI() {
  const state = { deferred: null, installed: false };
  const cfg = { delayMs: 4500, minScroll: 200, snoozeDays: 7 };
  const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone);
  const isAllowedPath = () => {
    try {
      const p = new URL(window.location.href).pathname;
      return /(?:^|\/)index\.html$/.test(p) || /\/$/.test(p);
    } catch { return true; }
  };
  const isSnoozed = () => {
    try { const until = Number(localStorage.getItem('pwaDismissUntil') || '0'); return Date.now() < until; } catch { return false; }
  };
  const snooze = () => { try { localStorage.setItem('pwaDismissUntil', String(Date.now() + cfg.snoozeDays * 86400000)); } catch { } };

  const createCard = () => {
    const card = document.createElement('div');
    card.className = 'install-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    card.setAttribute('aria-label', 'Uygulamayı yükle');

    const icon = document.createElement('img');
    icon.className = 'install-icon';
    icon.src = 'icon/bygog-lab-icon.svg';
    icon.alt = '';
    icon.width = 40; icon.height = 40;

    const textWrap = document.createElement('div');
    textWrap.className = 'install-text';
    const title = document.createElement('div');
    title.className = 'install-title';
    title.textContent = 'byGOG\'u yükle';
    const sub = document.createElement('div');
    sub.className = 'install-sub';
    sub.textContent = 'Hızlı erişim için ana ekrana ekle';
    textWrap.appendChild(title);
    textWrap.appendChild(sub);

    const hint = document.createElement('div');
    hint.className = 'install-hint';
    hint.textContent = '';

    const logoBtn = document.createElement('button');
    logoBtn.type = 'button';
    logoBtn.className = 'install-logo-btn';
    logoBtn.setAttribute('aria-label', 'Ana ekrana ekle');
    const logoImg = document.createElement('img');
    logoImg.src = 'icon/bygog-lab-icon.svg';
    logoImg.alt = '';
    logoImg.width = 56; logoImg.height = 56;
    logoImg.className = 'install-logo-img';
    logoBtn.appendChild(logoImg);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'install-close';
    closeBtn.setAttribute('aria-label', 'Kapat');
    closeBtn.innerHTML = '×';

    card.appendChild(icon);
    card.appendChild(textWrap);
    card.appendChild(hint);
    card.appendChild(logoBtn);
    card.appendChild(closeBtn);
    document.body.appendChild(card);

    // Handlers
    logoBtn.addEventListener('click', async () => {
      if (state.deferred) {
        try {
          await state.deferred.prompt();
          const choice = await state.deferred.userChoice;
          state.deferred = null;
          if (choice && choice.outcome === 'accepted') hide();
        } catch { }
      } else {
        alert('Uygulamayı ana ekrana eklemek için tarayıcınızın menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.');
      }
    });
    closeBtn.addEventListener('click', () => { snooze(); hide(); });

    // State updater (platform-aware)
    const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = () => /android/i.test(navigator.userAgent);
    const updateState = () => {
      const hasPrompt = !!state.deferred;
      if (hasPrompt) logoBtn.classList.add('ready'); else logoBtn.classList.remove('ready');
      // Hint when iOS (or no prompt available)
      if (isIOS()) {
        hint.style.display = '';
        hint.textContent = 'Safari: Paylaş menüsü → Ana Ekrana Ekle';
      } else if (!hasPrompt) {
        hint.style.display = '';
        hint.textContent = isAndroid() ? 'Chrome menüsü → Ana ekrana ekle' : 'Tarayıcı menüsü → Ana ekrana ekle';
      } else {
        hint.style.display = 'none';
      }
    };
    card._updateInstallState = updateState;
    updateState();
    return card;
  };

  let cardEl = null;
  let miniEl = null;
  const createMini = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'install-badge';
    btn.setAttribute('aria-label', 'Ana ekrana ekle');
    // Minimal plus icon (SVG)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const v = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    v.setAttribute('d', 'M12 5v14');
    v.setAttribute('stroke', 'currentColor');
    v.setAttribute('stroke-width', '2.2');
    v.setAttribute('stroke-linecap', 'round');
    v.setAttribute('fill', 'none');
    const h = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    h.setAttribute('d', 'M5 12h14');
    h.setAttribute('stroke', 'currentColor');
    h.setAttribute('stroke-width', '2.2');
    h.setAttribute('stroke-linecap', 'round');
    h.setAttribute('fill', 'none');
    g.appendChild(v); g.appendChild(h); svg.appendChild(g);
    btn.appendChild(svg);
    btn.addEventListener('click', async () => {
      if (state.deferred) {
        try {
          await state.deferred.prompt();
          const choice = await state.deferred.userChoice;
          state.deferred = null;
          if (choice && choice.outcome === 'accepted') hide();
        } catch { }
      } else {
        alert('Uygulamayı ana ekrana eklemek için tarayıcınızın menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.');
      }
    });
    const host = document.querySelector('.author-fab');
    if (host) host.appendChild(btn); else document.body.appendChild(btn);
    return btn;
  };
  const show = () => { if (!cardEl) cardEl = createCard(); cardEl.style.display = ''; };
  const showMini = () => { if (!miniEl) miniEl = createMini(); miniEl.style.display = ''; };
  const hide = () => { if (cardEl) cardEl.style.display = 'none'; if (miniEl) miniEl.style.display = 'none'; };

  if (isStandalone() || !isAllowedPath() || isSnoozed()) { hide(); return; }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferred = e;
    // Prefer mini icon near GitHub FAB
    showMini();
    try { if (miniEl) miniEl.classList.add('ready'); } catch { }
    try { if (cardEl && cardEl._updateInstallState) cardEl._updateInstallState(); } catch { }
  });
  window.addEventListener('appinstalled', () => { state.installed = true; hide(); });
  // Time + scroll gated fallback
  let timeOk = false, scrollOk = false;
  const maybeShow = () => { if (!state.deferred && !isStandalone() && !isSnoozed() && isAllowedPath() && timeOk && scrollOk) showMini(); };
  setTimeout(() => { timeOk = true; maybeShow(); }, cfg.delayMs);
  const onScroll = () => { if (window.scrollY >= cfg.minScroll) { scrollOk = true; maybeShow(); window.removeEventListener('scroll', onScroll); } };
  window.addEventListener('scroll', onScroll, { passive: true });
}

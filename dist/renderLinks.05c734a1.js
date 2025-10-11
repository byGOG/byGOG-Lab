export async function fetchLinks() {
  const res = await fetch("dist/links.json");
  if (!res.ok) throw new Error("links.json yüklenemedi");
  return res.json();
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

function createLinkItem(link) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = link.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  if (link.recommended) {
    const star = document.createElement("span");
    star.className = "star";
    star.title = "Önerilen";
    star.setAttribute("aria-label", "Önerilen");
    star.setAttribute("aria-hidden", "true");
    star.textContent = "⭐";
    a.appendChild(star);
  }

  if (link.icon) {
    const wrap = document.createElement("span");
    wrap.className = "icon-wrapper";
    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 28;
    img.height = 28;
    img.setAttribute('data-src', link.icon);
    img.src = "icon/fallback.svg";
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

  const text = document.createElement("span");
  text.className = "link-text";
  text.textContent = link.name;
  li.dataset.nameOriginal = link.name || "";
  a.appendChild(text);

  if (link.description) {
    const tip = document.createElement("span");
    tip.className = "custom-tooltip";
    if (link.icon) {
      const tipImg = document.createElement("img");
      tipImg.loading = "lazy";
      tipImg.decoding = "async";
      tipImg.width = 28;
      tipImg.height = 28;
      tipImg.setAttribute('data-src', link.icon);
      tipImg.onerror = () => {
        if (tipImg.src && !tipImg.src.endsWith("/icon/fallback.svg") && !tipImg.src.endsWith("icon/fallback.svg")) {
          tipImg.src = "icon/fallback.svg";
        }
      };
      if (link.alt) tipImg.alt = link.alt;
      tip.appendChild(tipImg);
    }
    tip.appendChild(document.createTextNode(link.description));

    a.appendChild(tip);
    // Lazy-load tooltip image on demand (hover/focus)
    const loadTipImg = () => {
      try {
        const ti = tip.querySelector('img[data-src]');
        if (ti) { ti.src = ti.getAttribute('data-src'); ti.removeAttribute('data-src'); }
      } catch {}
    };
    a.addEventListener('mouseenter', loadTipImg, { once: true });
    a.addEventListener('focusin', loadTipImg, { once: true });
  }

  try {
    const parts = [];
    if (link.name) parts.push(link.name);
    if (Array.isArray(link.tags) && link.tags.length) parts.push(link.tags.join(" "));
    li.dataset.search = parts.join(" ").toLocaleLowerCase("tr");
    try { if (link.folded) li.dataset.folded = String(link.folded); } catch {}
    if (link.description) li.dataset.descOriginal = link.description;
  } catch {}

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
  }

  return li;
}

function renderCategories(data, container) {
  const frag = document.createDocumentFragment();
  data.categories.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";

    const h2 = document.createElement("h2");
    h2.textContent = cat.title;
    card.appendChild(h2);

    const renderList = (links, parent) => {
      const ul = document.createElement("ul");
      // Sort inside groups alphabetically (tr): recommended A–Z, others A–Z
      const cmp = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "tr");
      const rec = links.filter(item => !!item.recommended).sort(cmp);
      const others = links.filter(item => !item.recommended).sort(cmp);
      const sorted = [...rec, ...others];
      let addedRecLabel = false;
      let addedOtherLabel = false;
      const hasRec = sorted.some(x => !!x.recommended);
      const hasOther = sorted.some(x => !x.recommended);
      sorted.forEach(item => {
        if (hasRec && hasOther && item.recommended && !addedRecLabel) {
          const lbl = document.createElement("li");
          lbl.className = "group-label";
          lbl.setAttribute("role", "presentation");
          lbl.textContent = "Önerilenler";
          ul.appendChild(lbl);
          addedRecLabel = true;
        }
        if (hasRec && hasOther && !item.recommended && !addedOtherLabel) {
          const lbl = document.createElement("li");
          lbl.className = "group-label";
          lbl.setAttribute("role", "presentation");
          lbl.textContent = "Diğerleri";
          ul.appendChild(lbl);
          addedOtherLabel = true;
        }
        ul.appendChild(createLinkItem(item));
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
        renderList(sub.links, sc);
        subWrap.appendChild(sc);
      });
      card.appendChild(subWrap);
    } else if (cat.links) {
      renderList(cat.links, card);
    }

    frag.appendChild(card);
  });
  container.appendChild(frag);
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
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
  }
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
      await copyToClipboard(btn.dataset.copy || '');
      resetState(successLabel, 'copied', 'success');
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
function updateCategoryVisibility() {}

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
    }
  };
}

function setupSearch() {
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
    engine = createWorkerSearchEngine(nodes, dataset, status) || createSyncSearchEngine(nodes, dataset, status);
    return engine;
  };

  let debounceTimer;
  function computeDelay(val){
    const n = (String(val||"").trim()).length;
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
      getEngine().run(input.value);
      try {
        const url = new URL(window.location.href);
        const v = (input.value || "").trim();
        if (v) url.searchParams.set("q", v); else url.searchParams.delete("q");
        history.replaceState(null, "", url.toString());
      } catch {}
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

    if (ev.key === "/" && !(ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey)) {
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
        } catch {}
      }
      ev.stopPropagation();
    } else if (ev.key === "Enter") {
      const q = (input.value || "").trim();
      if (!q) return;
      const firstLink = document.querySelector('.category-card li:not([style*="display: none"]) a[href]');
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
  } catch {}
}



function setupThemeToggle() {
  try { const c = document.querySelector('.theme-toggle-container'); if (c) c.remove(); } catch {}
  try { document.body.classList.add('koyu'); } catch {}
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
  const container = document.getElementById("links-container");
  try {
    const data = await fetchLinks();
    renderCategories(data, container);
  } catch (err) {
    container.textContent = "Bağlantılar yüklenemedi.";
    console.error(err);
  }
  setupCopyDelegation();
  setupSearch();
  setupPWAInstallUI();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then(
        reg => console.log("ServiceWorker registration successful with scope:", reg.scope),
        err => console.log("ServiceWorker registration failed:", err)
      );
      // Auto-reload when a new service worker takes control (ensures fresh content)
      try {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      } catch {}
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
    try { const until = Number(localStorage.getItem('pwaDismissUntil')||'0'); return Date.now() < until; } catch { return false; }
  };
  const snooze = () => { try { localStorage.setItem('pwaDismissUntil', String(Date.now() + cfg.snoozeDays*86400000)); } catch {} };

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
        } catch {}
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
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    const v = document.createElementNS('http://www.w3.org/2000/svg','path');
    v.setAttribute('d','M12 5v14');
    v.setAttribute('stroke','currentColor');
    v.setAttribute('stroke-width','2.2');
    v.setAttribute('stroke-linecap','round');
    v.setAttribute('fill','none');
    const h = document.createElementNS('http://www.w3.org/2000/svg','path');
    h.setAttribute('d','M5 12h14');
    h.setAttribute('stroke','currentColor');
    h.setAttribute('stroke-width','2.2');
    h.setAttribute('stroke-linecap','round');
    h.setAttribute('fill','none');
    g.appendChild(v); g.appendChild(h); svg.appendChild(g);
    btn.appendChild(svg);
    btn.addEventListener('click', async () => {
      if (state.deferred) {
        try {
          await state.deferred.prompt();
          const choice = await state.deferred.userChoice;
          state.deferred = null;
          if (choice && choice.outcome === 'accepted') hide();
        } catch {}
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
    try { if (miniEl) miniEl.classList.add('ready'); } catch {}
    try { if (cardEl && cardEl._updateInstallState) cardEl._updateInstallState(); } catch {}
  });
  window.addEventListener('appinstalled', () => { state.installed = true; hide(); });
  // Time + scroll gated fallback
  let timeOk = false, scrollOk = false;
  const maybeShow = () => { if (!state.deferred && !isStandalone() && !isSnoozed() && isAllowedPath() && timeOk && scrollOk) showMini(); };
  setTimeout(() => { timeOk = true; maybeShow(); }, cfg.delayMs);
  const onScroll = () => { if (window.scrollY >= cfg.minScroll) { scrollOk = true; maybeShow(); window.removeEventListener('scroll', onScroll); } };
  window.addEventListener('scroll', onScroll, { passive: true });
}


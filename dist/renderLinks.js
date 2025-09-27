export async function fetchLinks() {
  const res = await fetch("links.json");
  if (!res.ok) throw new Error("links.json yüklenemedi");
  return res.json();
}

const WINUTIL_COMMAND = 'irm "https://christitus.com/win" | iex';

function resolveCopyValue(link) {
  if (link && link.copyText) return String(link.copyText);
  const name = String((link == null ? void 0 : link.name) || "").toLocaleLowerCase("tr");
  const url = String((link == null ? void 0 : link.url) || "");
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
    img.src = link.icon;
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
      tipImg.src = link.icon;
      if (link.alt) tipImg.alt = link.alt;
      tip.appendChild(tipImg);
    }
    tip.appendChild(document.createTextNode(link.description));
    a.appendChild(tip);
  }

  try {
    const parts = [];
    if (link.name) parts.push(link.name);
    if (link.description) parts.push(link.description);
    if (Array.isArray(link.tags) && link.tags.length) parts.push(link.tags.join(" "));
    li.dataset.search = parts.join(" ").toLocaleLowerCase("tr");
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

    const copyToClipboard = async text => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }
    };

    let resetTimer;
    copyButton.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      copyButton.disabled = true;
      copyButton.classList.remove("copy-error", "copied");
      copyButton.classList.add("copy-loading");
      setIcon("loading");
      srLabel.textContent = loadingLabel;
      copyButton.setAttribute("aria-label", loadingLabel);

      const resetState = (label, className, iconName, ariaLabel) => {
        copyButton.classList.remove("copy-error", "copied", "copy-loading");
        if (className) copyButton.classList.add(className);
        srLabel.textContent = label;
        copyButton.setAttribute("aria-label", ariaLabel || label);
        setIcon(iconName || "copy");
        copyButton.disabled = false;
      };

      try {
        await copyToClipboard(copyValue);
        resetState(successLabel, "copied", "success");
      } catch {
        resetState(errorLabel, "copy-error", "error");
      }

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        resetState(defaultLabel, null, "copy", baseAriaLabel);
      }, 2000);
    });

    li.appendChild(copyButton);
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
      const sorted = [...links].sort((a, b) => {
        const ar = a.recommended ? 1 : 0;
        const br = b.recommended ? 1 : 0;
        if (ar !== br) return br - ar;
        return String(a.name || "").localeCompare(String(b.name || ""), "tr");
      });
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



const SEARCH_LOCALE = "tr";
const DIACRITIC_PATTERN = /[\u0300-\u036f]/g;

function normalizeForSearch(value) {
  return String(value || "").toLocaleLowerCase(SEARCH_LOCALE);
}

function foldForSearch(value) {
  return normalizeForSearch(value).normalize("NFD").replace(DIACRITIC_PATTERN, "");
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

function applyHighlight(node, regex) {
  const label = node.querySelector(".link-text");
  if (label) {
    const original = node.dataset.nameOriginal || label.textContent || "";
    if (regex) {
      label.innerHTML = original.replace(regex, match => `<mark>${match}</mark>`);
    } else {
      label.textContent = original;
    }
  }
  const tip = node.querySelector(".custom-tooltip");
  if (tip) {
    const descOriginal = node.dataset.descOriginal || "";
    if (descOriginal) {
      const img = tip.querySelector("img");
      const imgHTML = img ? img.outerHTML + " " : "";
      if (regex) {
        tip.innerHTML = imgHTML + descOriginal.replace(regex, match => `<mark>${match}</mark>`);
      } else {
        tip.innerHTML = imgHTML + descOriginal;
      }
    }
  }
}

function updateCategoryVisibility() {
  document.querySelectorAll(".category-card").forEach(card => {
    const subs = card.querySelectorAll(".sub-category");
    if (subs.length) {
      let any = false;
      subs.forEach(sc => {
        const hasVisible = sc.querySelectorAll('li:not([style*="display: none"])').length > 0;
        sc.style.display = hasVisible ? "" : "none";
        if (hasVisible) any = true;
      });
      card.style.display = any ? "" : "none";
    } else {
      const visible = card.querySelectorAll('li:not([style*="display: none"])');
      card.style.display = visible.length > 0 ? "" : "none";
    }
  });
}

function createMatchApplier(nodes, dataset, status) {
  const visible = new Set(dataset.map(entry => entry.index));
  return function applyMatches(meta, matches) {
    const matchSet = new Set(matches);
    const toHide = [];
    visible.forEach(idx => {
      if (!matchSet.has(idx)) toHide.push(idx);
    });
    toHide.forEach(idx => {
      const node = nodes[idx];
      node.style.display = "none";
      applyHighlight(node, null);
      visible.delete(idx);
    });
    let matchCount = 0;
    matchSet.forEach(idx => {
      const node = nodes[idx];
      if (!visible.has(idx)) {
        node.style.display = "";
        visible.add(idx);
      }
      applyHighlight(node, meta.regex);
      if (dataset[idx].isLink) matchCount++;
    });
    status.textContent = meta.hasQuery ? `${matchCount} sonuç bulundu` : "";
    updateCategoryVisibility();
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
    return {
      index,
      folded: foldForSearch(raw),
      isLink: !!el.querySelector(".link-text")
    };
  });

  const engine = createWorkerSearchEngine(nodes, dataset, status) || createSyncSearchEngine(nodes, dataset, status);

  let debounceTimer;
  const debounceDelay = 200;

  function runImmediate(value) {
    clearTimeout(debounceTimer);
    engine.run(value);
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      engine.run(input.value);
    }, debounceDelay);
  });

  document.addEventListener("keydown", ev => {
    if (ev.key === "/" && !(ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey)) {
      const t = ev.target;
      const tag = t && t.tagName ? t.tagName.toUpperCase() : "";
      if (t && t.isContentEditable) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
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
      }
      ev.stopPropagation();
    }
  });

  if (input.value) runImmediate(input.value);
}



function setupThemeToggle() {
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
  setupSearch();
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

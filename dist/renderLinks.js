// Rewritten for readability and small UX/accessibility improvements
export async function fetchLinks() {
  const res = await fetch("links.json");
  if (!res.ok) throw new Error("links.json yüklenemedi");
  return res.json();
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
    star.textContent = "★";
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

function setupSearch() {
  const input = document.getElementById("search-input");
  const status = document.getElementById("search-status");
  const items = Array.from(document.querySelectorAll(".category-card li"));
  const haystacks = items.map(el => (el.dataset.search || el.textContent).toLocaleLowerCase("tr"));
  let timer;

  function apply() {
    const q = input.value.toLocaleLowerCase("tr").trim();
    let matchCount = 0;
    const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") : null;

    items.forEach((el, idx) => {
      const matched = haystacks[idx].includes(q);
      el.style.display = matched ? "" : "none";
      if (matched) {
        matchCount++;
        const label = el.querySelector(".link-text");
        const original = el.dataset.nameOriginal || (label ? label.textContent : "");
        if (label) {
          label.innerHTML = (rx && q) ? original.replace(rx, m => `<mark>${m}</mark>`) : original;
        }
        const tip = el.querySelector(".custom-tooltip");
        if (tip) {
          const img = tip.querySelector("img");
          const imgHTML = img ? img.outerHTML + " " : "";
          const descOriginal = el.dataset.descOriginal || "";
          if (rx && q && descOriginal) tip.innerHTML = imgHTML + descOriginal.replace(rx, m => `<mark>${m}</mark>`);
          else if (descOriginal) tip.innerHTML = imgHTML + descOriginal;
        }
      } else {
        const label = el.querySelector(".link-text");
        if (label) label.textContent = el.dataset.nameOriginal || label.textContent;
        const tip = el.querySelector(".custom-tooltip");
        if (tip) {
          const img = tip.querySelector("img");
          const imgHTML = img ? img.outerHTML + " " : "";
          const descOriginal = el.dataset.descOriginal || "";
          if (descOriginal) tip.innerHTML = imgHTML + descOriginal;
        }
      }
    });

    document.querySelectorAll(".category-card").forEach(card => {
      const subs = card.querySelectorAll(".sub-category");
      if (subs.length) {
        let any = false;
        subs.forEach(sc => {
          const has = sc.querySelectorAll('li:not([style*="display: none"])').length > 0;
          sc.style.display = has ? "" : "none";
          if (has) any = true;
        });
        card.style.display = any ? "" : "none";
      } else {
        const visible = card.querySelectorAll('li:not([style*="display: none"])');
        card.style.display = visible.length > 0 ? "" : "none";
      }
    });

    status.textContent = q ? `${matchCount} sonuç bulundu` : "";
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 300);
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
        apply();
      }
      ev.stopPropagation();
    }
  });
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
    });
  }
});


export async function fetchLinks() {
  const response = await fetch('links.json');
  if (!response.ok) throw new Error('links.json yüklenemedi');
  return response.json();
}

function createLinkItem(link) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = link.url;
  a.target = '_blank';
  if (link.recommended) {
    const star = document.createElement('span');
    star.className = 'star';
    star.title = 'Önerilen';
    star.setAttribute('aria-label', 'Önerilen');
    star.textContent = '★';
    a.appendChild(star);
  }
  let iconWrapper;
  if (link.icon) {
    iconWrapper = document.createElement('span');
    iconWrapper.className = 'icon-wrapper';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = link.icon;
    if (link.alt) img.alt = link.alt;
    img.className = 'site-icon';
    iconWrapper.appendChild(img);
    a.appendChild(iconWrapper);
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = 'link-text';
  nameSpan.textContent = link.name;
  // keep original for highlighting resets
  li.dataset.nameOriginal = link.name || '';
  a.appendChild(nameSpan);
  if (link.description) {
    const tooltip = document.createElement('span');
    tooltip.className = 'custom-tooltip';
    if (link.icon) {
      const tipImg = document.createElement('img');
      tipImg.loading = 'lazy';
      tipImg.src = link.icon;
      if (link.alt) tipImg.alt = link.alt;
      tooltip.appendChild(tipImg);
    }
    tooltip.appendChild(document.createTextNode(link.description));
    a.appendChild(tooltip);
  }
  // Enrich search index: name + description + tags
  try {
    const parts = [];
    if (link.name) parts.push(link.name);
    if (link.description) parts.push(link.description);
    if (Array.isArray(link.tags) && link.tags.length) parts.push(link.tags.join(' '));
    li.dataset.search = (parts.join(' ')).toLowerCase();
    if (link.description) li.dataset.descOriginal = link.description;
  } catch {}
  li.appendChild(a);
  return li;
}

function renderCategories(data, container) {
  const fragment = document.createDocumentFragment();
  data.categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-card';
    const h2 = document.createElement('h2');
    h2.textContent = cat.title;
    card.appendChild(h2);

    if (cat.subcategories) {
      const subContainer = document.createElement('div');
      subContainer.className = 'sub-category-container';
      cat.subcategories.forEach(sc => {
        const subDiv = document.createElement('div');
        subDiv.className = 'sub-category';
        const h3 = document.createElement('h3');
        h3.textContent = sc.title;
        subDiv.appendChild(h3);
        const ul = document.createElement('ul');
        const sorted = [...sc.links].sort((a,b)=>{
          const ar = a.recommended?1:0; const br = b.recommended?1:0;
          if (ar!==br) return br-ar; // recommended first
          // secondary by name for stable order
          return String(a.name||'').localeCompare(String(b.name||''), 'tr');
        });
        let recInserted = false, othersInserted = false;
        const hasRec = sorted.some(x=>!!x.recommended);
        const hasNon = sorted.some(x=>!x.recommended);
        sorted.forEach(link => {
          if (hasRec && hasNon && link.recommended && !recInserted) {
            const label = document.createElement('li');
            label.className = 'group-label';
            label.setAttribute('role','presentation');
            label.textContent = 'Önerilenler';
            ul.appendChild(label);
            recInserted = true;
          }
          if (hasRec && hasNon && !link.recommended && !othersInserted) {
            const label = document.createElement('li');
            label.className = 'group-label';
            label.setAttribute('role','presentation');
            label.textContent = 'Diğerleri';
            ul.appendChild(label);
            othersInserted = true;
          }
          ul.appendChild(createLinkItem(link));
        });
        subDiv.appendChild(ul);
        subContainer.appendChild(subDiv);
      });
      card.appendChild(subContainer);
    } else if (cat.links) {
      const ul = document.createElement('ul');
      const sorted = [...cat.links].sort((a,b)=>{
        const ar = a.recommended?1:0; const br = b.recommended?1:0;
        if (ar!==br) return br-ar;
        return String(a.name||'').localeCompare(String(b.name||''), 'tr');
      });
      let recInserted = false, othersInserted = false;
      const hasRec = sorted.some(x=>!!x.recommended);
      const hasNon = sorted.some(x=>!x.recommended);
      sorted.forEach(link => {
        if (hasRec && hasNon && link.recommended && !recInserted) {
          const label = document.createElement('li');
          label.className = 'group-label';
          label.setAttribute('role','presentation');
          label.textContent = 'Önerilenler';
          ul.appendChild(label);
          recInserted = true;
        }
        if (hasRec && hasNon && !link.recommended && !othersInserted) {
          const label = document.createElement('li');
          label.className = 'group-label';
          label.setAttribute('role','presentation');
          label.textContent = 'Diğerleri';
          ul.appendChild(label);
          othersInserted = true;
        }
        ul.appendChild(createLinkItem(link));
      });
      card.appendChild(ul);
    }

    fragment.appendChild(card);
  });
  container.appendChild(fragment);
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchStatus = document.getElementById('search-status');
  const links = Array.from(document.querySelectorAll('.category-card li'));
  const linksText = links.map(link => (link.dataset.search || link.textContent).toLowerCase());

  let debounceTimer;

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    let matchCount = 0;
    const re = query ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null;

    links.forEach((link, index) => {
      const isMatch = linksText[index].includes(query);
      link.style.display = isMatch ? '' : 'none';
      if (isMatch) {
        matchCount++;
        // highlight name text
        const span = link.querySelector('.link-text');
        const original = link.dataset.nameOriginal || (span ? span.textContent : '');
        if (span) {
          if (re && query) {
            span.innerHTML = original.replace(re, m => `<mark>${m}</mark>`);
          } else {
            span.textContent = original;
          }
        }
        // highlight description text (tooltip)
        const tooltip = link.querySelector('.custom-tooltip');
        if (tooltip) {
          const img = tooltip.querySelector('img');
          const imgHtml = img ? img.outerHTML + ' ' : '';
          const desc = link.dataset.descOriginal || '';
          if (re && query && desc) {
            tooltip.innerHTML = imgHtml + desc.replace(re, m => `<mark>${m}</mark>`);
          } else if (desc) {
            tooltip.innerHTML = imgHtml + desc;
          }
        }
      } else {
        // reset highlight if hidden
        const span = link.querySelector('.link-text');
        if (span) span.textContent = link.dataset.nameOriginal || span.textContent;
        const tooltip = link.querySelector('.custom-tooltip');
        if (tooltip) {
          const img = tooltip.querySelector('img');
          const imgHtml = img ? img.outerHTML + ' ' : '';
          const desc = link.dataset.descOriginal || '';
          if (desc) tooltip.innerHTML = imgHtml + desc;
        }
      }
    });

    document.querySelectorAll('.category-card').forEach(card => {
      const subCats = card.querySelectorAll('.sub-category');
      if (subCats.length) {
        let isCardVisible = false;
        subCats.forEach(sc => {
          const visibleLinks = sc.querySelectorAll('li:not([style*="display: none"])');
          const subVisible = visibleLinks.length > 0;
          sc.style.display = subVisible ? '' : 'none';
          if (subVisible) {
            isCardVisible = true;
          }
        });
        card.style.display = isCardVisible ? '' : 'none';
      } else {
        const visibleLinks = card.querySelectorAll('li:not([style*="display: none"])');
        card.style.display = visibleLinks.length > 0 ? '' : 'none';
      }
    });

    searchStatus.textContent = query ? `${matchCount} sonuç bulundu` : '';
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 300);
  });
  // '/' to focus search; 'Esc' to clear
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toUpperCase() : '';
      const editable = (t && t.isContentEditable) || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (!editable) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    }
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchInput.value) {
        searchInput.value = '';
        performSearch();
      }
      e.stopPropagation();
    }
  });
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const ICON_MOON = '🌙';
  const ICON_SUN = '☀️';

  function setTheme(isDark) {
    const nowDark = !!isDark;
    if (nowDark) {
      body.classList.add('koyu');
      themeToggle.textContent = ICON_SUN;
      themeToggle.setAttribute('aria-label', 'Aydınlık temaya geç');
    } else {
      body.classList.remove('koyu');
      themeToggle.textContent = ICON_MOON;
      themeToggle.setAttribute('aria-label', 'Koyu temaya geç');
    }
    themeToggle.setAttribute('aria-pressed', String(nowDark));
  }

  themeToggle.addEventListener('click', () => {
    const isDark = !body.classList.contains('koyu');
    setTheme(isDark);
    localStorage.setItem('theme', isDark ? 'koyu' : 'aydinlik');
  });

  let saved = localStorage.getItem('theme');
  if (!saved) {
    saved = mediaQuery.matches ? 'koyu' : 'aydinlik';
  }
  setTheme(saved === 'koyu');

  mediaQuery.addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupThemeToggle();
  const container = document.getElementById('links-container');
  try {
    const data = await fetchLinks();
    renderCategories(data, container);
  } catch (err) {
    container.textContent = 'Bağlantılar yüklenemedi.';
    console.error(err);
  }
  setupSearch();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, err => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
});
// normalizeText kaldırıldı: tüm içerik UTF-8'e düzeltildi ve doğrudan kullanılıyor.

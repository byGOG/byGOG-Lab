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
        sc.links.forEach(link => ul.appendChild(createLinkItem(link)));
        subDiv.appendChild(ul);
        subContainer.appendChild(subDiv);
      });
      card.appendChild(subContainer);
    } else if (cat.links) {
      const ul = document.createElement('ul');
      cat.links.forEach(link => ul.appendChild(createLinkItem(link)));
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
  const linksText = links.map(link => link.textContent.toLowerCase());

  let debounceTimer;

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    let matchCount = 0;

    links.forEach((link, index) => {
      const isMatch = linksText[index].includes(query);
      link.style.display = isMatch ? '' : 'none';
      if (isMatch) {
        matchCount++;
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
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function setTheme(isDark) {
    if (isDark) {
      body.classList.add('koyu');
      themeToggle.textContent = '☀️';
    } else {
      body.classList.remove('koyu');
      themeToggle.textContent = '🌙';
    }
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

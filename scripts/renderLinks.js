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
  const searchClear = document.querySelector('.search-clear');
  const searchSuggestions = document.getElementById('search-suggestions');
  const links = Array.from(document.querySelectorAll('.category-card li'));
  
  let searchData = [];
  let currentSuggestionIndex = -1;
  let debounceTimer;

  // Prepare search data with more information
  function prepareSearchData() {
    searchData = [];
    links.forEach((link, index) => {
      const linkElement = link.querySelector('a');
      const text = linkElement.textContent.toLowerCase();
      const category = link.closest('.category-card')?.querySelector('h2')?.textContent || '';
      const subcategory = link.closest('.sub-category')?.querySelector('h3')?.textContent || '';
      const description = linkElement.querySelector('.custom-tooltip')?.textContent || '';
      
      searchData.push({
        element: link,
        text: text,
        category: category.toLowerCase(),
        subcategory: subcategory.toLowerCase(),
        description: description.toLowerCase(),
        originalText: linkElement.textContent,
        categoryText: category,
        subcategoryText: subcategory
      });
    });
  }

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
      // Show all results
      links.forEach(link => link.style.display = '');
      document.querySelectorAll('.category-card').forEach(card => card.style.display = '');
      document.querySelectorAll('.sub-category').forEach(sub => sub.style.display = '');
      searchStatus.innerHTML = '';
      searchSuggestions.classList.remove('visible');
      return;
    }

    let matchCount = 0;
    const matchedItems = [];

    // Search through all data
    searchData.forEach(item => {
      const isMatch = 
        item.text.includes(query) ||
        item.category.includes(query) ||
        item.subcategory.includes(query) ||
        item.description.includes(query);

      if (isMatch) {
        item.element.style.display = '';
        matchedItems.push(item);
        matchCount++;
      } else {
        item.element.style.display = 'none';
      }
    });

    // Update category visibility
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

    // Update search status with animation
    if (query) {
      searchStatus.innerHTML = `<span class="search-results-count">${matchCount} sonuç bulundu</span>`;
      searchStatus.setAttribute('aria-live', 'polite');
      
      // Show search suggestions
      showSearchSuggestions(matchedItems, query);
    } else {
      searchStatus.innerHTML = '';
      searchStatus.setAttribute('aria-live', 'off');
      searchSuggestions.classList.remove('visible');
    }
  }

  function showSearchSuggestions(matchedItems, query) {
    if (matchedItems.length === 0) {
      searchSuggestions.classList.remove('visible');
      return;
    }

    // Create suggestion items (max 8)
    const suggestions = matchedItems.slice(0, 8);
    searchSuggestions.innerHTML = '';

    suggestions.forEach(item => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      
      const icon = item.element.querySelector('.site-icon');
      const iconHtml = icon ? `<img src="${icon.src}" alt="" class="suggestion-icon">` : '<div class="suggestion-icon">📱</div>';
      
      suggestionItem.innerHTML = `
        ${iconHtml}
        <div class="suggestion-text">${item.originalText}</div>
        <div class="suggestion-category">${item.categoryText}${item.subcategoryText ? ` > ${item.subcategoryText}` : ''}</div>
      `;

      suggestionItem.addEventListener('click', () => {
        // Scroll to the item
        item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the item temporarily
        item.element.style.animation = 'searchResultPulse 1s ease-out';
        setTimeout(() => {
          item.element.style.animation = '';
        }, 1000);
        
        // Clear search
        searchInput.value = '';
        performSearch();
        searchSuggestions.classList.remove('visible');
        searchInput.focus();
      });

      searchSuggestions.appendChild(suggestionItem);
    });

    searchSuggestions.classList.add('visible');
  }

  function clearSearch() {
    searchInput.value = '';
    searchInput.focus();
    performSearch();
  }

  function handleKeyboardNavigation(e) {
    const suggestions = searchSuggestions.querySelectorAll('.suggestion-item');
    
    if (!searchSuggestions.classList.contains('visible') || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
        updateSuggestionSelection(suggestions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
        updateSuggestionSelection(suggestions);
        break;
      case 'Enter':
        e.preventDefault();
        if (currentSuggestionIndex >= 0 && suggestions[currentSuggestionIndex]) {
          suggestions[currentSuggestionIndex].click();
        }
        break;
      case 'Escape':
        searchSuggestions.classList.remove('visible');
        searchInput.blur();
        break;
    }
  }

  function updateSuggestionSelection(suggestions) {
    suggestions.forEach((item, index) => {
      item.classList.toggle('selected', index === currentSuggestionIndex);
    });
  }

  // Event listeners
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 300);
    
    // Show/hide clear button
    searchClear.classList.toggle('visible', searchInput.value.length > 0);
  });

  searchInput.addEventListener('keydown', handleKeyboardNavigation);
  
  searchClear.addEventListener('click', clearSearch);
  
  // Click outside to close suggestions
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
      searchSuggestions.classList.remove('visible');
    }
  });

  // Initialize
  prepareSearchData();
  
  // Update search data when content changes
  const observer = new MutationObserver(() => {
    prepareSearchData();
  });
  
  observer.observe(document.getElementById('links-container'), {
    childList: true,
    subtree: true
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
      themeToggle.setAttribute('aria-label', 'Açık temaya geç');
      themeToggle.title = 'Açık temaya geç';
    } else {
      body.classList.remove('koyu');
      themeToggle.textContent = '🌙';
      themeToggle.setAttribute('aria-label', 'Koyu temaya geç');
      themeToggle.title = 'Koyu temaya geç';
    }
    
    // Smooth transition effect
    body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
      body.style.transition = '';
    }, 500);
  }

  function toggleTheme() {
    const isDark = !body.classList.contains('koyu');
    setTheme(isDark);
    localStorage.setItem('theme', isDark ? 'koyu' : 'aydinlik');
    
    // Add click animation
    themeToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
      themeToggle.style.transform = '';
    }, 150);
  }

  themeToggle.addEventListener('click', toggleTheme);
  
  // Keyboard support
  themeToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Load saved theme or use system preference
  let saved = localStorage.getItem('theme');
  if (!saved) {
    saved = mediaQuery.matches ? 'koyu' : 'aydinlik';
  }
  setTheme(saved === 'koyu');

  // Listen for system theme changes
  mediaQuery.addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches);
    }
  });
  
  // Add theme change event for other components
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      setTheme(e.newValue === 'koyu');
    }
  });
}

function setupMouseTracking() {
  const links = document.querySelectorAll('a');
  
  links.forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      link.style.setProperty('--mouse-x', `${x}%`);
      link.style.setProperty('--mouse-y', `${y}%`);
    });
  });
}

function setupAnimations() {
  // Add staggered animation delays for list items
  const listItems = document.querySelectorAll('li');
  listItems.forEach((item, index) => {
    item.style.animationDelay = `${0.1 + (index * 0.05)}s`;
    item.style.animation = 'fadeInUp 0.5s ease-out forwards';
    item.style.opacity = '0';
  });
  
  // Trigger animations when elements come into view
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.animation = 'fadeInUp 0.5s ease-out forwards';
      }
    });
  }, observerOptions);
  
  listItems.forEach(item => observer.observe(item));
}

document.addEventListener('DOMContentLoaded', async () => {
  setupThemeToggle();
  const container = document.getElementById('links-container');
  try {
    const data = await fetchLinks();
    renderCategories(data, container);
  } catch (err) {
    container.textContent = 'Bağlantılar yüklenemedi. Lütfen sayfayı yenileyin.';
    console.error('Bağlantılar yüklenirken hata:', err);
  }
  setupSearch();
  setupMouseTracking();
  setupAnimations();
});

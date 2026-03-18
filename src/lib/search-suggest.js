/**
 * Search autocomplete suggestions.
 * Shows a dropdown of matching link names as the user types.
 */

const MAX_SUGGESTIONS = 6;

/**
 * @param {HTMLInputElement} input
 * @param {HTMLElement} container - #links-container
 */
export function initSearchSuggest(input, container) {
  if (!input || !container) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'search-suggest';
  dropdown.setAttribute('role', 'listbox');
  dropdown.id = 'search-suggest';
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', 'search-suggest');

  // Append to body so it escapes any overflow:hidden containers
  document.body.appendChild(dropdown);

  let activeIndex = -1;
  let items = [];

  function getAllNames() {
    const names = [];
    container.querySelectorAll('li[data-name-original]').forEach(li => {
      const name = li.dataset.nameOriginal;
      const icon = li.querySelector('.site-icon')?.getAttribute('src') || '';
      const url = li.querySelector('a[href]')?.href || '';
      if (name) names.push({ name, icon, url });
    });
    return names;
  }

  function render(matches) {
    dropdown.innerHTML = '';
    items = matches;
    activeIndex = -1;

    if (!matches.length) {
      dropdown.classList.remove('visible');
      input.removeAttribute('aria-activedescendant');
      return;
    }

    // Position dropdown below input
    const rect = input.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.setProperty('--suggest-width', `${rect.width}px`);
    dropdown.style.width = `${rect.width}px`;

    matches.forEach((m, i) => {
      const opt = document.createElement('div');
      opt.className = 'search-suggest-item';
      opt.setAttribute('role', 'option');
      opt.id = `suggest-${i}`;

      if (m.icon) {
        const img = document.createElement('img');
        img.src = m.icon;
        img.alt = '';
        img.width = 18;
        img.height = 18;
        img.onerror = () => {
          img.src = 'icon/fallback.svg';
        };
        opt.appendChild(img);
      }

      opt.appendChild(document.createTextNode(m.name));
      opt.addEventListener('mousedown', ev => {
        ev.preventDefault();
        selectItem(m);
      });
      dropdown.appendChild(opt);
    });

    dropdown.classList.add('visible');
  }

  function selectItem(m) {
    input.value = m.name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    hide();
    // Scroll to the item
    const li = container.querySelector(`li[data-name-original="${CSS.escape(m.name)}"]`);
    if (li) {
      li.scrollIntoView({ behavior: 'smooth', block: 'center' });
      li.classList.add('search-highlight');
      setTimeout(() => li.classList.remove('search-highlight'), 1500);
    }
  }

  function hide() {
    dropdown.classList.remove('visible');
    dropdown.innerHTML = '';
    items = [];
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
  }

  function setActive(idx) {
    const children = dropdown.querySelectorAll('.search-suggest-item');
    children.forEach(c => c.classList.remove('active'));
    activeIndex = idx;
    if (idx >= 0 && idx < children.length) {
      children[idx].classList.add('active');
      input.setAttribute('aria-activedescendant', `suggest-${idx}`);
      children[idx].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  input.addEventListener('input', () => {
    const q = (input.value || '').trim().toLocaleLowerCase('tr');
    if (q.length < 2) {
      hide();
      return;
    }

    const all = getAllNames();
    const exact = [];
    const partial = [];

    for (const entry of all) {
      const lower = entry.name.toLocaleLowerCase('tr');
      if (lower.startsWith(q)) exact.push(entry);
      else if (lower.includes(q)) partial.push(entry);
      if (exact.length + partial.length >= MAX_SUGGESTIONS) break;
    }

    render([...exact, ...partial].slice(0, MAX_SUGGESTIONS));
  });

  input.addEventListener('keydown', ev => {
    if (!dropdown.classList.contains('visible')) return;

    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setActive(activeIndex < items.length - 1 ? activeIndex + 1 : 0);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setActive(activeIndex > 0 ? activeIndex - 1 : items.length - 1);
    } else if (ev.key === 'Enter' && activeIndex >= 0) {
      ev.preventDefault();
      ev.stopPropagation();
      selectItem(items[activeIndex]);
    } else if (ev.key === 'Escape') {
      hide();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(hide, 150);
  });
}

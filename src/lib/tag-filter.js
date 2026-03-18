/**
 * Tag filter bar — allows filtering links by tags.
 * Tags come from each link's `tags` array in the data.
 * Multiple tags can be selected (AND logic).
 */
import { t } from './i18n.js';
import { readUrlState, writeUrlState } from './url-state.js';

/** @type {Set<string>} */
let activeTags = new Set();
let _bar = null;
let _container = null;

/**
 * Collect all unique tags from the DOM.
 * @param {HTMLElement} container
 * @returns {string[]}
 */
function collectTags(container) {
  const tagSet = new Set();
  container.querySelectorAll('.tag-chip[data-tag]').forEach(chip => {
    const tag = chip.dataset.tag;
    if (tag) tagSet.add(tag);
  });
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * Apply tag filter — hide non-matching <li> elements.
 * @param {HTMLElement} container
 */
function applyTagFilter(container) {
  if (!activeTags.size) {
    container.querySelectorAll('.category-card li.tag-hidden').forEach(li => {
      li.classList.remove('tag-hidden');
    });
    // Show all subcategories/categories that might be hidden
    container
      .querySelectorAll('.sub-category[data-tag-hidden], .category-card[data-tag-hidden]')
      .forEach(el => {
        el.style.display = '';
        el.removeAttribute('data-tag-hidden');
      });
    return;
  }

  const tagsArr = Array.from(activeTags);

  container.querySelectorAll('.category-card li').forEach(li => {
    const chips = li.querySelectorAll('.tag-chip[data-tag]');
    const liTags = new Set();
    chips.forEach(c => {
      if (c.dataset.tag) liTags.add(c.dataset.tag);
    });
    const match = tagsArr.every(t => liTags.has(t));
    li.classList.toggle('tag-hidden', !match);
  });

  // Hide empty subcategories and categories
  container.querySelectorAll('.sub-category').forEach(sub => {
    const visible = sub.querySelectorAll('li:not(.tag-hidden):not(.filter-hidden):not(.is-hidden)');
    if (visible.length) {
      sub.style.display = '';
      sub.removeAttribute('data-tag-hidden');
    } else {
      sub.style.display = 'none';
      sub.setAttribute('data-tag-hidden', '1');
    }
  });

  container.querySelectorAll('.category-card').forEach(card => {
    const visible = card.querySelectorAll(
      'li:not(.tag-hidden):not(.filter-hidden):not(.is-hidden)'
    );
    if (visible.length) {
      card.style.display = '';
      card.removeAttribute('data-tag-hidden');
    } else {
      card.style.display = 'none';
      card.setAttribute('data-tag-hidden', '1');
    }
  });
}

/**
 * Update button active states.
 */
function updateButtonStates() {
  if (!_bar) return;
  _bar.querySelectorAll('.tag-filter-btn').forEach(btn => {
    btn.classList.toggle('active', activeTags.has(btn.dataset.tag));
  });
  const clearBtn = _bar.querySelector('.tag-filter-clear');
  if (clearBtn) clearBtn.hidden = activeTags.size === 0;
}

/**
 * Toggle a tag filter.
 * @param {string} tag
 */
function toggleTag(tag) {
  if (activeTags.has(tag)) activeTags.delete(tag);
  else activeTags.add(tag);
  writeUrlState({ tag: activeTags.size ? Array.from(activeTags) : null });
  updateButtonStates();
  if (_container) applyTagFilter(_container);
}

/**
 * Clear all active tag filters.
 */
function clearAllTags() {
  activeTags.clear();
  writeUrlState({ tag: null });
  updateButtonStates();
  if (_container) applyTagFilter(_container);
}

/**
 * Initialize the tag filter bar.
 * @param {HTMLElement} container - #links-container
 */
export function initTagFilter(container) {
  if (!container) return;
  _container = container;

  // Remove existing bar if re-initialized
  const existing = container.parentElement?.querySelector('.tag-filter-bar');
  if (existing) existing.remove();

  const allTags = collectTags(container);
  if (!allTags.length) return;

  const bar = document.createElement('div');
  bar.className = 'tag-filter-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', t('tags.label'));
  _bar = bar;

  const label = document.createElement('span');
  label.className = 'tag-filter-bar-label';
  label.textContent = t('tags.label');
  bar.appendChild(label);

  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-filter-btn';
    btn.dataset.tag = tag;
    btn.textContent = tag;
    btn.addEventListener('click', () => toggleTag(tag));
    bar.appendChild(btn);
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'tag-filter-clear';
  clearBtn.textContent = t('tags.clearAll');
  clearBtn.hidden = true;
  clearBtn.addEventListener('click', clearAllTags);
  bar.appendChild(clearBtn);

  // Insert after quick-filter-bar
  const quickBar = container.parentElement?.querySelector('.quick-filter-bar');
  if (quickBar) {
    quickBar.insertAdjacentElement('afterend', bar);
  } else {
    container.parentElement.insertBefore(bar, container);
  }

  // Restore tags from URL
  try {
    const urlState = readUrlState();
    if (urlState.tag && urlState.tag.length) {
      urlState.tag.forEach(t => activeTags.add(t));
      updateButtonStates();
      applyTagFilter(container);
    }
  } catch {}

  // Watch for lazy-loaded categories to re-apply filter and add new tags
  const mo = new MutationObserver(() => {
    // Add any new tags that appeared
    const newTags = collectTags(container);
    newTags.forEach(tag => {
      if (!bar.querySelector(`.tag-filter-btn[data-tag="${CSS.escape(tag)}"]`)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tag-filter-btn';
        btn.dataset.tag = tag;
        btn.textContent = tag;
        btn.addEventListener('click', () => toggleTag(tag));
        bar.insertBefore(btn, clearBtn);
      }
    });
    // Re-apply filter to newly loaded items
    if (activeTags.size) applyTagFilter(container);
  });
  mo.observe(container, { childList: true, subtree: true });

  // Language change
  window.addEventListener('langchange', () => {
    label.textContent = t('tags.label');
    bar.setAttribute('aria-label', t('tags.label'));
    clearBtn.textContent = t('tags.clearAll');
  });
}

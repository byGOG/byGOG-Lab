/**
 * Batch Install — select multiple tools and generate a combined winget command.
 * Features a cart-style panel showing selected items with individual removal.
 */
import { t } from './i18n.js';

/** @type {Map<string, {name: string, command: string, li: HTMLLIElement}>} */
const selected = new Map();
let _container = null;
let _panel = null;
let _cartList = null;
let _countEl = null;
let _genBtn = null;
let _clearBtn = null;
let _cartToggle = null;
let _active = false;
let _cartOpen = false;

/**
 * Extract winget package ID from copyText.
 * @param {string} copyText
 * @returns {string|null}
 */
function extractWingetId(copyText) {
  const m = copyText.match(/winget\s+install\s+(\S+)/i);
  return m ? m[1] : null;
}

/**
 * Generate batch command from selected items.
 * @returns {string}
 */
function generateCommand() {
  const commands = [];
  for (const [, item] of selected) {
    const copyText = item.command || '';
    const id = extractWingetId(copyText);
    if (id) {
      commands.push(`winget install ${id}`);
    } else if (copyText.trim()) {
      commands.push(copyText.trim());
    }
  }
  return commands.join(' && ');
}

/**
 * Render the cart item list.
 */
function renderCartList() {
  if (!_cartList) return;
  _cartList.innerHTML = '';

  if (selected.size === 0) {
    const empty = document.createElement('div');
    empty.className = 'batch-cart-empty';
    empty.textContent = t('batch.empty');
    _cartList.appendChild(empty);
    return;
  }

  for (const [name, item] of selected) {
    const row = document.createElement('div');
    row.className = 'batch-cart-item';

    const label = document.createElement('span');
    label.className = 'batch-cart-item-name';
    label.textContent = name;
    row.appendChild(label);

    const cmd = document.createElement('span');
    cmd.className = 'batch-cart-item-cmd';
    const id = extractWingetId(item.command);
    cmd.textContent = id || item.command;
    row.appendChild(cmd);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'batch-cart-item-remove';
    removeBtn.innerHTML = '×';
    removeBtn.setAttribute('aria-label', t('batch.removeItem', { name }));
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      removeSelection(name);
    });
    row.appendChild(removeBtn);

    _cartList.appendChild(row);
  }
}

/**
 * Update the panel UI.
 */
function updatePanel() {
  if (!_panel) return;
  const count = selected.size;
  if (_countEl) _countEl.textContent = t('batch.selected', { count });
  if (_genBtn) _genBtn.disabled = count === 0;
  _panel.classList.toggle('visible', count > 0 || _cartOpen);
  renderCartList();
}

/**
 * Toggle cart list visibility.
 */
function toggleCart() {
  _cartOpen = !_cartOpen;
  if (_panel) _panel.classList.toggle('cart-open', _cartOpen);
  if (_cartToggle) {
    _cartToggle.classList.toggle('open', _cartOpen);
    _cartToggle.setAttribute('aria-expanded', String(_cartOpen));
  }
}

/**
 * Toggle selection for a <li>.
 * @param {HTMLLIElement} li
 */
function toggleSelection(li) {
  const name = li.dataset.nameOriginal || '';
  if (!name) return;
  if (selected.has(name)) {
    removeSelection(name);
  } else {
    const copyBtn = li.querySelector('.copy-button[data-copy]');
    const command = copyBtn?.dataset.copy || '';
    selected.set(name, { name, command, li });
    li.classList.add('batch-selected');
    updatePanel();
  }
}

/**
 * Remove a single item from selection.
 * @param {string} name
 */
function removeSelection(name) {
  const item = selected.get(name);
  if (item?.li) item.li.classList.remove('batch-selected');
  selected.delete(name);
  updatePanel();
}

/**
 * Clear all selections.
 */
function clearSelections() {
  for (const [, item] of selected) {
    if (item.li) item.li.classList.remove('batch-selected');
  }
  selected.clear();
  _cartOpen = false;
  if (_panel) _panel.classList.remove('cart-open');
  if (_cartToggle) {
    _cartToggle.classList.remove('open');
    _cartToggle.setAttribute('aria-expanded', 'false');
  }
  updatePanel();
}

/**
 * Show the batch result modal.
 * @param {string} command
 */
function showResultModal(command) {
  const modal = document.createElement('div');
  modal.className = 'batch-result-modal';
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  const content = document.createElement('div');
  content.className = 'batch-result-content';

  const title = document.createElement('div');
  title.className = 'batch-result-title';
  title.textContent = t('batch.title');
  content.appendChild(title);

  const code = document.createElement('pre');
  code.className = 'batch-result-code';
  code.textContent = command;
  content.appendChild(code);

  const actions = document.createElement('div');
  actions.className = 'batch-result-actions';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'batch-panel-btn primary';
  copyBtn.textContent = t('batch.copy');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(command);
      copyBtn.textContent = t('batch.copied');
      setTimeout(() => {
        copyBtn.textContent = t('batch.copy');
      }, 1500);
    } catch {}
  });
  actions.appendChild(copyBtn);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'batch-panel-btn';
  closeBtn.textContent = t('info.close');
  closeBtn.addEventListener('click', () => modal.remove());
  actions.appendChild(closeBtn);

  content.appendChild(actions);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

/**
 * Enter batch mode.
 */
function enterBatchMode() {
  _active = true;
  document.body.classList.add('batch-mode');
  if (_panel) _panel.classList.toggle('visible', selected.size > 0);
}

/**
 * Exit batch mode.
 */
function exitBatchMode() {
  _active = false;
  document.body.classList.remove('batch-mode');
  clearSelections();
  if (_panel) _panel.classList.remove('visible');
}

/**
 * Initialize batch install system.
 * @param {HTMLElement} container - #links-container
 */
export function initBatchInstall(container) {
  if (!container) return;
  _container = container;

  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'batch-toggle-btn';
  toggleBtn.textContent = t('batch.toggle');
  toggleBtn.addEventListener('click', () => {
    if (_active) {
      exitBatchMode();
      toggleBtn.classList.remove('active');
    } else {
      enterBatchMode();
      toggleBtn.classList.add('active');
    }
  });

  // Insert into filter row (inside quick-filter-bar)
  const filterRow = container.parentElement?.querySelector('.filter-row');
  if (filterRow) {
    filterRow.appendChild(toggleBtn);
  } else {
    const quickBar = container.parentElement?.querySelector('.quick-filter-bar');
    if (quickBar) quickBar.appendChild(toggleBtn);
  }

  // Create floating panel with cart
  const panel = document.createElement('div');
  panel.className = 'batch-panel';
  _panel = panel;

  // Cart list (expandable)
  const cartList = document.createElement('div');
  cartList.className = 'batch-cart-list';
  _cartList = cartList;
  panel.appendChild(cartList);

  // Bottom bar
  const bar = document.createElement('div');
  bar.className = 'batch-panel-bar';

  // Cart toggle (chevron + count)
  const cartToggle = document.createElement('button');
  cartToggle.type = 'button';
  cartToggle.className = 'batch-cart-toggle';
  cartToggle.setAttribute('aria-expanded', 'false');
  cartToggle.setAttribute('aria-label', t('batch.showCart'));
  _cartToggle = cartToggle;

  const chevron = document.createElement('span');
  chevron.className = 'batch-cart-chevron';
  chevron.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  cartToggle.appendChild(chevron);

  const countEl = document.createElement('span');
  countEl.className = 'batch-panel-count';
  countEl.textContent = t('batch.selected', { count: 0 });
  _countEl = countEl;
  cartToggle.appendChild(countEl);

  cartToggle.addEventListener('click', toggleCart);
  bar.appendChild(cartToggle);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'batch-panel-actions';

  const genBtn = document.createElement('button');
  genBtn.type = 'button';
  genBtn.className = 'batch-panel-btn primary';
  genBtn.textContent = t('batch.generate');
  genBtn.disabled = true;
  genBtn.addEventListener('click', () => {
    const cmd = generateCommand();
    if (cmd) showResultModal(cmd);
  });
  _genBtn = genBtn;
  btnGroup.appendChild(genBtn);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'batch-panel-btn danger';
  clearBtn.textContent = t('batch.clear');
  clearBtn.addEventListener('click', clearSelections);
  _clearBtn = clearBtn;
  btnGroup.appendChild(clearBtn);

  bar.appendChild(btnGroup);
  panel.appendChild(bar);

  document.body.appendChild(panel);

  // Event delegation for clicking <li> items in batch mode
  container.addEventListener(
    'click',
    ev => {
      if (!_active) return;
      const li = ev.target.closest('.category-card li.has-copy');
      if (!li || !container.contains(li)) return;
      if (li.classList.contains('has-powershell')) return;
      // Don't interfere with info buttons or copy buttons
      if (
        ev.target.closest('button.info-button') ||
        ev.target.closest('.copy-button') ||
        ev.target.closest('.share-btn')
      ) {
        return;
      }
      ev.preventDefault();
      ev.stopPropagation();
      toggleSelection(li);
    },
    true
  );

  // Language change
  window.addEventListener('langchange', () => {
    toggleBtn.textContent = t('batch.toggle');
    if (_genBtn) _genBtn.textContent = t('batch.generate');
    if (_clearBtn) _clearBtn.textContent = t('batch.clear');
    if (_cartToggle) _cartToggle.setAttribute('aria-label', t('batch.showCart'));
    updatePanel();
  });
}

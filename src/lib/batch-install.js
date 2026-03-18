/**
 * Batch Install — select multiple tools and generate a combined winget command.
 */
import { t } from './i18n.js';

/** @type {Set<string>} selected link names */
const selected = new Set();
let _container = null;
let _panel = null;
let _active = false;

/**
 * Extract winget package ID from copyText.
 * e.g. "winget install 7zip.7zip" → "7zip.7zip"
 * @param {string} copyText
 * @returns {string|null}
 */
function extractWingetId(copyText) {
  const m = copyText.match(/winget\s+install\s+(?:--id\s+)?(\S+)/i);
  return m ? m[1] : null;
}

/**
 * Generate batch command from selected items.
 * @returns {string}
 */
function generateCommand() {
  if (!_container) return '';
  const commands = [];
  _container.querySelectorAll('.category-card li.batch-selected').forEach(li => {
    const copyBtn = li.querySelector('.copy-button[data-copy]');
    if (!copyBtn) return;
    const copyText = copyBtn.dataset.copy || '';
    const id = extractWingetId(copyText);
    if (id) {
      commands.push(
        `winget install --id ${id} -e --accept-source-agreements --accept-package-agreements`
      );
    } else if (copyText.trim()) {
      commands.push(copyText.trim());
    }
  });
  return commands.join(' && ');
}

/**
 * Update the panel UI.
 */
function updatePanel() {
  if (!_panel) return;
  const count = selected.size;
  const countEl = _panel.querySelector('.batch-panel-count');
  if (countEl) countEl.textContent = t('batch.selected', { count });
  _panel.classList.toggle('visible', count > 0);
}

/**
 * Toggle selection for a <li>.
 * @param {HTMLLIElement} li
 */
function toggleSelection(li) {
  const name = li.dataset.nameOriginal || '';
  if (!name) return;
  if (selected.has(name)) {
    selected.delete(name);
    li.classList.remove('batch-selected');
  } else {
    selected.add(name);
    li.classList.add('batch-selected');
  }
  updatePanel();
}

/**
 * Clear all selections.
 */
function clearSelections() {
  selected.clear();
  if (_container) {
    _container.querySelectorAll('.batch-selected').forEach(li => {
      li.classList.remove('batch-selected');
    });
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

  // Insert after quick-filter-bar
  const quickBar = container.parentElement?.querySelector('.quick-filter-bar');
  if (quickBar) {
    quickBar.appendChild(toggleBtn);
  }

  // Create floating panel
  const panel = document.createElement('div');
  panel.className = 'batch-panel';
  _panel = panel;

  const countEl = document.createElement('span');
  countEl.className = 'batch-panel-count';
  countEl.textContent = t('batch.selected', { count: 0 });
  panel.appendChild(countEl);

  const genBtn = document.createElement('button');
  genBtn.type = 'button';
  genBtn.className = 'batch-panel-btn primary';
  genBtn.textContent = t('batch.generate');
  genBtn.addEventListener('click', () => {
    const cmd = generateCommand();
    if (cmd) showResultModal(cmd);
  });
  panel.appendChild(genBtn);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'batch-panel-btn danger';
  clearBtn.textContent = t('batch.clear');
  clearBtn.addEventListener('click', clearSelections);
  panel.appendChild(clearBtn);

  document.body.appendChild(panel);

  // Event delegation for clicking <li> items in batch mode
  container.addEventListener(
    'click',
    ev => {
      if (!_active) return;
      const li = ev.target.closest('.category-card li.has-copy');
      if (!li || !container.contains(li)) return;
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
    genBtn.textContent = t('batch.generate');
    clearBtn.textContent = t('batch.clear');
    updatePanel();
  });
}

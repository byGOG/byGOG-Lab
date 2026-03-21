/**
 * Keyboard shortcuts help modal
 * Opens with '?' key, closes with Escape or clicking overlay
 */
import { t } from './i18n.js';

let overlay = null;

const SHORTCUTS = [
  { keys: ['/', '.', 'Ctrl+K'], label: 'keyboard.focusSearch' },
  { keys: ['Esc'], label: 'keyboard.clearSearch' },
  { keys: ['Enter'], label: 'keyboard.firstResult' },
  { keys: ['\u2191', '\u2193'], label: 'keyboard.prevNext' },
  { keys: ['?'], label: 'keyboard.help' }
];

function createOverlay() {
  const el = document.createElement('div');
  el.className = 'kbd-help-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', t('keyboard.ariaLabel'));

  const panel = document.createElement('div');
  panel.className = 'kbd-help-panel';

  const heading = document.createElement('h2');
  heading.className = 'kbd-help-title';
  heading.textContent = t('keyboard.title');
  panel.appendChild(heading);

  const list = document.createElement('dl');
  list.className = 'kbd-help-list';

  SHORTCUTS.forEach(({ keys, label }) => {
    const row = document.createElement('div');
    row.className = 'kbd-help-row';

    const dt = document.createElement('dt');
    keys.forEach((key, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'kbd-help-sep';
        sep.textContent = ` ${t('keyboard.or')} `;
        dt.appendChild(sep);
      }
      const kbd = document.createElement('kbd');
      kbd.textContent = key;
      dt.appendChild(kbd);
    });

    const dd = document.createElement('dd');
    dd.textContent = t(label);

    row.appendChild(dt);
    row.appendChild(dd);
    list.appendChild(row);
  });

  panel.appendChild(list);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'kbd-help-close';
  closeBtn.setAttribute('aria-label', t('info.close'));
  closeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  closeBtn.addEventListener('click', hide);
  panel.appendChild(closeBtn);

  el.appendChild(panel);

  // Close on overlay click
  el.addEventListener('click', e => {
    if (e.target === el) hide();
  });

  document.body.appendChild(el);
  return el;
}

function show() {
  if (!overlay) overlay = createOverlay();
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  // Focus trap: focus close button
  const closeBtn = overlay.querySelector('.kbd-help-close');
  if (closeBtn) closeBtn.focus();
}

function hide() {
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function isVisible() {
  return overlay && overlay.classList.contains('show');
}

export function initKeyboardHelp() {
  document.addEventListener('keydown', e => {
    // '?' opens help (Shift+/ on most keyboards)
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target && e.target.isContentEditable) return;
      e.preventDefault();
      if (isVisible()) hide();
      else show();
      return;
    }
    // Escape closes help
    if (e.key === 'Escape' && isVisible()) {
      e.preventDefault();
      e.stopPropagation();
      hide();
    }
  });
}

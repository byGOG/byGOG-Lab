/**
 * Link item DOM creation
 * Extracted from renderLinks.js for modularity and testability
 */
import { t } from './i18n.js';
import type { Link } from '../types.js';

interface CreateLinkItemDeps {
  isSvgIcon: (path: string) => boolean;
  resolveCopyValue: (link: Link) => string;
  setCopyIconOnButton: (btn: HTMLElement, name: string) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
  isNewLink?: (name: string) => boolean;
}

/**
 * Create a link list item element
 */
export function createLinkItem(link: Link, deps: CreateLinkItemDeps): HTMLLIElement {
  const { isSvgIcon, resolveCopyValue, setCopyIconOnButton, copyToClipboard, isNewLink } = deps;

  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = link.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (link.name) a.setAttribute('aria-label', t('a11y.openNewTab', { name: link.name }));

  if (link.icon) {
    const wrap = document.createElement('span');
    wrap.className = 'icon-wrapper';
    const img = document.createElement('img');
    const svgIcon = isSvgIcon(link.icon);
    img.loading = svgIcon ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.width = 28;
    img.height = 28;
    if (svgIcon) {
      img.src = link.icon;
    } else {
      img.setAttribute('data-src', link.icon);
      img.src = 'icon/fallback.svg';
    }
    img.onerror = () => {
      if (
        img.src &&
        !img.src.endsWith('/icon/fallback.svg') &&
        !img.src.endsWith('icon/fallback.svg')
      ) {
        img.src = 'icon/fallback.svg';
      }
    };
    if (link.alt) img.alt = link.alt;
    img.className = 'site-icon';
    wrap.appendChild(img);
    a.appendChild(wrap);
  }

  const textCol = document.createElement('div');
  textCol.className = 'text-col';

  const text = document.createElement('span');
  text.className = 'link-text';
  text.textContent = link.name;
  li.dataset.nameOriginal = link.name || '';
  // "Yeni" badge for newly added links
  if (isNewLink && link.name && isNewLink(link.name)) {
    const badge = document.createElement('span');
    badge.className = 'new-badge';
    badge.textContent = t('badge.new');
    badge.setAttribute('aria-label', t('badge.newAria'));
    text.appendChild(badge);
  }

  const titleRow = document.createElement('div');
  titleRow.className = 'link-title';
  titleRow.appendChild(text);
  textCol.appendChild(titleRow);

  a.appendChild(textCol);

  // Create custom-tooltip for info-tooltips.js to enhance
  if (link.description) {
    const tip = document.createElement('span');
    tip.className = 'custom-tooltip';
    const tipId = `tip-${(link.name || '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase()}`;
    tip.id = tipId;
    a.setAttribute('aria-describedby', tipId);

    if (link.icon) {
      const tipImg = document.createElement('img');
      tipImg.loading = 'lazy';
      tipImg.width = 24;
      tipImg.height = 24;
      tipImg.setAttribute('data-src', link.icon);
      tipImg.className = 'tip-icon';
      tipImg.onerror = () => {
        tipImg.src = 'icon/fallback.svg';
      };
      tip.appendChild(tipImg);
    }

    tip.appendChild(document.createTextNode(link.description));
    a.appendChild(tip);
  }

  try {
    const parts: string[] = [];
    if (link.name) parts.push(link.name);
    if (link.description) parts.push(link.description);
    if (link.url) parts.push(link.url);
    if (link.copyText) parts.push(link.copyText);
    if (Array.isArray(link.tags) && link.tags.length) parts.push(link.tags.join(' '));
    li.dataset.search = parts.join(' ').toLocaleLowerCase('tr');
    if (link.name) li.dataset.nameSearch = link.name.toLocaleLowerCase('tr');
    if (link.recommended) li.dataset.recommended = '1';
    try {
      // Append description, url, copyText to pre-computed folded for full-text search
      const extra = [link.description, link.url, link.copyText].filter(Boolean).join(' ');
      const base = link.folded ? String(link.folded) : '';
      li.dataset.folded = extra ? (base + ' ' + extra).toLocaleLowerCase('tr') : base;
    } catch {}
    if (link.description) li.dataset.descOriginal = link.description;
    if (link.postInstallNote) li.dataset.postInstallNote = link.postInstallNote;
  } catch {}

  li.appendChild(a);

  const copyValue = resolveCopyValue(link);

  if (copyValue) {
    li.classList.add('has-copy');
    // Detect PowerShell commands (irm, iex, powershell, pwsh)
    const cvLower = copyValue.toLowerCase();
    if (/\b(irm|iex|powershell|pwsh)\b/.test(cvLower)) {
      li.classList.add('has-powershell');
    }
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'copy-button';
    const defaultLabel = t('copy.default');
    const successLabel = t('copy.success');
    const errorLabel = t('copy.error');
    const loadingLabel = t('copy.loading');

    const srLabel = document.createElement('span');
    srLabel.className = 'sr-only';
    srLabel.textContent = defaultLabel;

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');

    const iconShapes: Record<string, string> = {
      copy: '<rect x="9" y="9" width="12" height="12" rx="2" ry="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
      success: '<path d="M20 6 10 16l-4-4"></path>',
      error: '<path d="M18 6 6 18"></path><path d="M6 6l12 12"></path>',
      loading:
        '<circle cx="12" cy="12" r="9" stroke-opacity="0.25"></circle><path d="M21 12a9 9 0 0 0-9-9" stroke-opacity="0.9"></path>'
    };

    const setIcon = (name: string): void => {
      icon.innerHTML = iconShapes[name] || iconShapes.copy;
    };

    setIcon('copy');

    copyButton.appendChild(icon);
    copyButton.appendChild(srLabel);

    const baseAriaLabel = link.name ? t('copy.ariaLabel', { name: link.name }) : defaultLabel;
    copyButton.setAttribute('aria-label', baseAriaLabel);
    copyButton.title = t('copy.tooltip');

    copyButton.dataset.copy = copyValue;
    copyButton.dataset.labelDefault = defaultLabel;
    copyButton.dataset.labelSuccess = successLabel;
    copyButton.dataset.labelError = errorLabel;
    copyButton.dataset.labelLoading = loadingLabel;
    copyButton.dataset.ariaBase = baseAriaLabel;

    copyButton.addEventListener('click', async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      if (copyButton.disabled) return;

      const dl = copyButton.dataset.labelDefault || 'Kopyala';
      const sl = copyButton.dataset.labelSuccess || 'Kopyalandı';
      const el = copyButton.dataset.labelError || 'Kopyalanamadı';
      const ll = copyButton.dataset.labelLoading || 'Kopyalanıyor';
      const ba = copyButton.dataset.ariaBase || dl;
      const sr = copyButton.querySelector('.sr-only');

      const resetState = (label: string, className: string | null, iconName?: string, ariaLabel?: string): void => {
        copyButton.classList.remove('copy-error', 'copied', 'copy-loading');
        if (className) copyButton.classList.add(className);
        if (sr) sr.textContent = label;
        copyButton.setAttribute('aria-label', ariaLabel || label);
        setCopyIconOnButton(copyButton, iconName || 'copy');
        copyButton.disabled = false;
      };

      copyButton.disabled = true;
      copyButton.classList.remove('copy-error', 'copied');
      copyButton.classList.add('copy-loading');
      setCopyIconOnButton(copyButton, 'loading');
      if (sr) sr.textContent = ll;
      copyButton.setAttribute('aria-label', ll);

      try {
        const ok = await copyToClipboard(copyButton.dataset.copy || '');
        if (ok) resetState(sl, 'copied', 'success');
        else resetState(el, 'copy-error', 'error');
      } catch {
        resetState(el, 'copy-error', 'error');
      }

      if ((copyButton as HTMLButtonElement & { _resetTimer?: ReturnType<typeof setTimeout> })._resetTimer) {
        clearTimeout((copyButton as HTMLButtonElement & { _resetTimer?: ReturnType<typeof setTimeout> })._resetTimer);
      }
      (copyButton as HTMLButtonElement & { _resetTimer?: ReturnType<typeof setTimeout> })._resetTimer = setTimeout(() => {
        resetState(dl, null, 'copy', ba);
      }, 2500);
    });

    const cmdRow = document.createElement('div');
    cmdRow.className = 'link-cmd-row';
    const cmdLine = document.createElement('code');
    cmdLine.className = 'link-cmd';
    cmdLine.textContent = copyValue;
    cmdRow.appendChild(cmdLine);
    cmdRow.appendChild(copyButton);
    li.appendChild(cmdRow);
  }

  return li;
}

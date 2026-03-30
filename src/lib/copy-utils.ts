/**
 * Clipboard copy utilities
 */

import { WINUTIL_COMMAND } from './constants.js';
import { showToast } from './toast.js';
import type { Link } from '../types.js';

export const COPY_ICON_SHAPES: Record<string, string> = {
  copy: '<rect x="9" y="9" width="12" height="12" rx="2" ry="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
  success: '<path d="M20 6 10 16l-4-4"></path>',
  error: '<path d="M18 6 6 18"></path><path d="M6 6l12 12"></path>',
  loading:
    '<circle cx="12" cy="12" r="9" stroke-opacity="0.25"></circle><path d="M21 12a9 9 0 0 0-9-9" stroke-opacity="0.9"></path>'
};

export function resolveCopyValue(link: Partial<Link> | null): string {
  if (link && link.copyText) return String(link.copyText);
  const name = String(link?.name || '').toLocaleLowerCase('tr');
  const url = String(link?.url || '');
  if (name === 'winutil' || url.includes('christitus.com/win')) {
    return WINUTIL_COMMAND;
  }
  return '';
}

export function setCopyIconOnButton(btn: HTMLButtonElement, name: string): void {
  const svg = btn.querySelector('svg');
  if (svg) svg.innerHTML = COPY_ICON_SHAPES[name] || COPY_ICON_SHAPES.copy;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  const fallback = (): boolean => {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(temp);
    return ok;
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        return fallback();
      } catch {
        return false;
      }
    }
  }
  try {
    return fallback();
  } catch {
    return false;
  }
}

interface CopyButton extends HTMLButtonElement {
  _resetTimer?: ReturnType<typeof setTimeout>;
}

export function setupCopyDelegation(container: HTMLElement): void {
  if (!container || container.dataset.copyDelegation === 'on') return;
  container.dataset.copyDelegation = 'on';

  container.addEventListener('click', async ev => {
    const target = ev.target as HTMLElement | null;
    if (!target || !target.closest) return;
    const btn = target.closest('button.copy-button') as CopyButton | null;
    if (!btn || !container.contains(btn)) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (btn.disabled) return;

    const defaultLabel = btn.dataset.labelDefault || 'Kopyala';
    const successLabel = btn.dataset.labelSuccess || 'Kopyalandı';
    const errorLabel = btn.dataset.labelError || 'Kopyalanamadı';
    const loadingLabel = btn.dataset.labelLoading || 'Kopyalanıyor';
    const baseAriaLabel = btn.dataset.ariaBase || defaultLabel;
    const sr = btn.querySelector('.sr-only');

    const resetState = (label: string, className: string | null, iconName: string | null, ariaLabel?: string) => {
      btn.classList.remove('copy-error', 'copied', 'copy-loading');
      if (className) btn.classList.add(className);
      if (sr) sr.textContent = label;
      btn.setAttribute('aria-label', ariaLabel || label);
      setCopyIconOnButton(btn, iconName || 'copy');
      btn.disabled = false;
    };

    btn.disabled = true;
    btn.classList.remove('copy-error', 'copied');
    btn.classList.add('copy-loading');
    setCopyIconOnButton(btn, 'loading');
    if (sr) sr.textContent = loadingLabel;
    btn.setAttribute('aria-label', loadingLabel);

    try {
      const copyText = btn.dataset.copy || '';
      const ok = await copyToClipboard(copyText);
      if (ok) {
        resetState(successLabel, 'copied', 'success');
        const isPowershell = /\b(irm|iex|powershell|pwsh)\b/i.test(copyText);
        showToast(isPowershell ? 'PowerShell komutu kopyalandı' : successLabel);
      } else {
        resetState(errorLabel, 'copy-error', 'error');
      }
    } catch {
      resetState(errorLabel, 'copy-error', 'error');
    }

    if (btn._resetTimer) clearTimeout(btn._resetTimer);
    btn._resetTimer = setTimeout(() => {
      resetState(defaultLabel, null, 'copy', baseAriaLabel);
    }, 2500);
  });
}

export { WINUTIL_COMMAND } from './constants.js';

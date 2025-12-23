/**
 * Clipboard copy utilities
 */

const WINUTIL_COMMAND = 'irm "https://christitus.com/win" | iex';

export const COPY_ICON_SHAPES = {
  copy: '<rect x="9" y="9" width="12" height="12" rx="2" ry="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
  success: '<path d="M20 6 10 16l-4-4"></path>',
  error: '<path d="M18 6 6 18"></path><path d="M6 6l12 12"></path>',
  loading: '<circle cx="12" cy="12" r="9" stroke-opacity="0.25"></circle><path d="M21 12a9 9 0 0 0-9-9" stroke-opacity="0.9"></path>'
};

/**
 * Resolve copy value for a link
 * @param {object} link
 * @returns {string}
 */
export function resolveCopyValue(link) {
  if (link && link.copyText) return String(link.copyText);
  const name = String(link?.name || "").toLocaleLowerCase("tr");
  const url = String(link?.url || "");
  if (name === "winutil" || url.includes("christitus.com/win")) {
    return WINUTIL_COMMAND;
  }
  return "";
}

/**
 * Set icon on copy button
 * @param {HTMLButtonElement} btn
 * @param {string} name
 */
export function setCopyIconOnButton(btn, name) {
  const svg = btn.querySelector('svg');
  if (svg) svg.innerHTML = COPY_ICON_SHAPES[name] || COPY_ICON_SHAPES.copy;
}

/**
 * Copy text to clipboard with fallback
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  const fallback = () => {
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
      try { return fallback(); } catch { return false; }
    }
  }
  try { return fallback(); } catch { return false; }
}

/**
 * Setup copy button event delegation on container
 * @param {HTMLElement} container
 */
export function setupCopyDelegation(container) {
  if (!container || container.dataset.copyDelegation === 'on') return;
  container.dataset.copyDelegation = 'on';
  
  container.addEventListener('click', async ev => {
    const target = ev.target;
    if (!target || !target.closest) return;
    const btn = target.closest('button.copy-button');
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

    const resetState = (label, className, iconName, ariaLabel) => {
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
      const ok = await copyToClipboard(btn.dataset.copy || '');
      if (ok) resetState(successLabel, 'copied', 'success');
      else resetState(errorLabel, 'copy-error', 'error');
    } catch {
      resetState(errorLabel, 'copy-error', 'error');
    }

    if (btn._resetTimer) clearTimeout(btn._resetTimer);
    btn._resetTimer = setTimeout(() => {
      resetState(defaultLabel, null, 'copy', baseAriaLabel);
    }, 2000);
  });
}

export { WINUTIL_COMMAND };

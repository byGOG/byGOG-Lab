/**
 * Pano (clipboard) işlemleri
 */

import * as logger from './logger.js';

/**
 * Metni panoya kopyalar
 * @param {string} text - Kopyalanacak metin
 * @returns {Promise<boolean>} - Başarılı olursa true
 */
export async function copyToClipboard(text) {
  // Modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      logger.warn('clipboard', 'Clipboard API başarısız, fallback deneniyor', err);
      return fallbackCopy(text);
    }
  }
  
  // Fallback: execCommand
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    logger.error('clipboard', 'Fallback kopyalama başarısız', err);
    return false;
  }
}

export default { copyToClipboard };

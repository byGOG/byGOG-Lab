/**
 * Global error handler — catches uncaught errors and unhandled rejections
 * Pipes to logger.error() for localStorage persistence
 */

import { error as logError } from './logger.js';

const MODULE = 'global';

export function initGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', event => {
    const { message, filename, lineno, colno, error: err } = event;
    logError(MODULE, message || 'Unknown error', {
      filename: filename ?? null,
      lineno: lineno ?? null,
      colno: colno ?? null,
      stack: err?.stack || null
    });
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection');
    logError(MODULE, message, {
      type: 'unhandledrejection',
      stack: reason instanceof Error ? reason.stack : null
    });
  });
}

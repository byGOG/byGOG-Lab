/**
 * Merkezi loglama sistemi - hata takibi ve debug için
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
} as const;

const currentLevel = LOG_LEVELS.WARN;

interface StoredError {
  timestamp: string;
  module: string;
  message: string;
  data: unknown;
}

function formatMessage(level: string, module: string, message: string, _data?: Record<string, unknown> | null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${module}]`;
  return { prefix, message };
}

export function debug(module: string, message: string, data: Record<string, unknown> | null = null): void {
  if (currentLevel > LOG_LEVELS.DEBUG) return;
  const { prefix } = formatMessage('DEBUG', module, message, data);
  console.debug(prefix, message, data || '');
}

export function info(module: string, message: string, data: Record<string, unknown> | null = null): void {
  if (currentLevel > LOG_LEVELS.INFO) return;
  const { prefix } = formatMessage('INFO', module, message, data);
  console.info(prefix, message, data || '');
}

export function warn(module: string, message: string, data: Record<string, unknown> | null = null): void {
  if (currentLevel > LOG_LEVELS.WARN) return;
  const { prefix } = formatMessage('WARN', module, message, data);
  console.warn(prefix, message, data || '');
}

export function error(module: string, message: string, data: Record<string, unknown> | Error | null = null): void {
  const { prefix } = formatMessage('ERROR', module, message);
  console.error(prefix, message, data || '');

  try {
    const errors: StoredError[] = JSON.parse(localStorage.getItem('bygog_errors') || '[]');
    errors.push({
      timestamp: new Date().toISOString(),
      module,
      message,
      data:
        data instanceof Error ? { name: data.name, message: data.message, stack: data.stack } : data
    });
    if (errors.length > 50) errors.shift();
    localStorage.setItem('bygog_errors', JSON.stringify(errors));
  } catch {
    // localStorage erişilemez
  }
}

export function getStoredErrors(): StoredError[] {
  try {
    return JSON.parse(localStorage.getItem('bygog_errors') || '[]');
  } catch {
    return [];
  }
}

export function clearStoredErrors(): void {
  try {
    localStorage.removeItem('bygog_errors');
  } catch {
    // localStorage erişilemez
  }
}

export default { debug, info, warn, error, getStoredErrors, clearStoredErrors };

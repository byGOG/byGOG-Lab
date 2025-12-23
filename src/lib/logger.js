/**
 * Merkezi loglama sistemi - hata takibi ve debug için
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = LOG_LEVELS.WARN;

function formatMessage(level, module, message, data) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${module}]`;
  return { prefix, message, data };
}

export function debug(module, message, data = null) {
  if (currentLevel > LOG_LEVELS.DEBUG) return;
  const { prefix } = formatMessage('DEBUG', module, message, data);
  console.debug(prefix, message, data || '');
}

export function info(module, message, data = null) {
  if (currentLevel > LOG_LEVELS.INFO) return;
  const { prefix } = formatMessage('INFO', module, message, data);
  console.info(prefix, message, data || '');
}

export function warn(module, message, data = null) {
  if (currentLevel > LOG_LEVELS.WARN) return;
  const { prefix } = formatMessage('WARN', module, message, data);
  console.warn(prefix, message, data || '');
}

export function error(module, message, data = null) {
  const { prefix } = formatMessage('ERROR', module, message, data);
  console.error(prefix, message, data || '');
  
  // Hataları localStorage'a kaydet (debug için)
  try {
    const errors = JSON.parse(localStorage.getItem('bygog_errors') || '[]');
    errors.push({
      timestamp: new Date().toISOString(),
      module,
      message,
      data: data instanceof Error ? { name: data.name, message: data.message, stack: data.stack } : data
    });
    // Son 50 hatayı tut
    if (errors.length > 50) errors.shift();
    localStorage.setItem('bygog_errors', JSON.stringify(errors));
  } catch {
    // localStorage erişilemez
  }
}

export function getStoredErrors() {
  try {
    return JSON.parse(localStorage.getItem('bygog_errors') || '[]');
  } catch {
    return [];
  }
}

export function clearStoredErrors() {
  try {
    localStorage.removeItem('bygog_errors');
  } catch {
    // localStorage erişilemez
  }
}

export default { debug, info, warn, error, getStoredErrors, clearStoredErrors };

/**
 * DOM yardımcı fonksiyonları
 */

/**
 * Element oluşturur ve özelliklerini atar
 */
export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  
  if (options.className) el.className = options.className;
  if (options.id) el.id = options.id;
  if (options.textContent) el.textContent = options.textContent;
  if (options.innerHTML) el.innerHTML = options.innerHTML;
  
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  
  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      el.dataset[key] = value;
    });
  }
  
  if (options.styles) {
    Object.entries(options.styles).forEach(([key, value]) => {
      el.style[key] = value;
    });
  }
  
  if (options.children) {
    options.children.forEach(child => {
      if (child) el.appendChild(child);
    });
  }
  
  if (options.parent) {
    options.parent.appendChild(el);
  }
  
  return el;
}

/**
 * SVG element oluşturur
 */
export function createSVGElement(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

/**
 * Element event'lerini durdurur (navigation engellemek için)
 */
export function stopNavigation(el) {
  ['click', 'mousedown', 'mouseup'].forEach(ev => {
    try {
      el.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    } catch {
      // Event listener eklenemedi
    }
  });
  
  ['touchstart', 'touchend'].forEach(ev => {
    try {
      el.addEventListener(ev, e => {
        e.stopPropagation();
      }, { passive: true });
    } catch {
      // Event listener eklenemedi
    }
  });
}

/**
 * Debounce fonksiyonu
 */
export function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle fonksiyonu
 */
export function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export default {
  createElement,
  createSVGElement,
  stopNavigation,
  debounce,
  throttle
};

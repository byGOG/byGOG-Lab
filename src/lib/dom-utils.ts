/**
 * DOM yardımcı fonksiyonları
 */

interface CreateElementOptions {
  className?: string;
  id?: string;
  textContent?: string;
  innerHTML?: string;
  attrs?: Record<string, string>;
  dataset?: Record<string, string>;
  styles?: Record<string, string>;
  children?: (Node | null)[];
  parent?: HTMLElement;
}

export function createElement(tag: string, options: CreateElementOptions = {}): HTMLElement {
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
      (el.style as unknown as Record<string, string>)[key] = value;
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

export function createSVGElement(tag: string, attrs: Record<string, string> = {}): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

export function stopNavigation(el: HTMLElement): void {
  ['click', 'mousedown', 'mouseup'].forEach(ev => {
    try {
      el.addEventListener(
        ev,
        e => {
          e.preventDefault();
          e.stopPropagation();
        },
        { passive: false }
      );
    } catch {
      // Event listener eklenemedi
    }
  });

  ['touchstart', 'touchend'].forEach(ev => {
    try {
      el.addEventListener(
        ev,
        e => {
          e.stopPropagation();
        },
        { passive: true }
      );
    } catch {
      // Event listener eklenemedi
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
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

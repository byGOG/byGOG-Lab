import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock all dependencies before importing
vi.mock('../src/back-to-top.js', () => ({ initBackToTop: vi.fn() }));
vi.mock('../src/category-nav.js', () => ({ initCategoryNav: vi.fn() }));
vi.mock('../src/lib/data-fetcher.js', () => ({
  fetchLinks: vi.fn()
}));
vi.mock('../src/lib/tooltip.js', () => ({
  closeActiveTooltip: vi.fn()
}));
vi.mock('../src/lib/domain-utils.js', () => ({
  isSvgIcon: vi.fn(icon => icon && icon.endsWith('.svg'))
}));
vi.mock('../src/lib/category-icons.js', () => ({
  getCategoryIcon: vi.fn(() => '<svg></svg>'),
  getSubcategoryIcon: vi.fn(() => ''),
  applyCategoryColumns: vi.fn()
}));
vi.mock('../src/lib/copy-utils.js', () => ({
  resolveCopyValue: vi.fn(() => ''),
  setCopyIconOnButton: vi.fn(),
  copyToClipboard: vi.fn(),
  setupCopyDelegation: vi.fn()
}));
vi.mock('../src/lib/link-item.js', async importOriginal => {
  const actual = await importOriginal();
  return actual;
});
vi.mock('../src/lib/search-engine.js', () => ({
  foldForSearch: vi.fn(v => v),
  createWorkerSearchEngine: vi.fn(),
  createSyncSearchEngine: vi.fn()
}));
vi.mock('../src/lib/pwa-install.js', () => ({ setupPWAInstallUI: vi.fn() }));
vi.mock('../src/lib/new-badge.js', () => ({
  isNewLink: vi.fn(() => false),
  updateKnownLinks: vi.fn()
}));
vi.mock('../src/lib/recent-links.js', () => ({
  trackClick: vi.fn(),
  renderRecentStrip: vi.fn(),
  getVisitedNames: vi.fn(() => new Set())
}));
vi.mock('../src/lib/quick-filters.js', () => ({
  initQuickFilters: vi.fn()
}));
vi.mock('../src/lib/category-collapse.js', () => ({
  initCategoryCollapse: vi.fn()
}));
vi.mock('../src/lib/web-share.js', () => ({
  initWebShare: vi.fn()
}));
vi.mock('../src/lib/scroll-restore.js', () => ({
  initScrollRestore: vi.fn()
}));
vi.mock('../src/lib/search-suggest.js', () => ({
  initSearchSuggest: vi.fn()
}));
vi.mock('../src/lazy-loader.js', () => ({
  initLazyCategories: vi.fn()
}));
vi.mock('../src/lib/logger.js', () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
}));

let createLinkItem;
let createCategoryCard;
let renderCategoryContent;

describe('renderLinks', () => {
  beforeAll(async () => {
    const mod = await import('../src/renderLinks.js');
    createLinkItem = mod._createLinkItem;
    createCategoryCard = mod._createCategoryCard;
    renderCategoryContent = mod._renderCategoryContent;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLinkItem', () => {
    it('creates a list item with an anchor', () => {
      const link = { name: 'Test App', url: 'https://example.com', icon: 'icon/test.svg' };
      const li = createLinkItem(link);

      expect(li.tagName).toBe('LI');
      const a = li.querySelector('a');
      expect(a).toBeTruthy();
      expect(a.href).toContain('example.com');
      expect(a.target).toBe('_blank');
      expect(a.rel).toBe('noopener noreferrer');
    });

    it('sets aria-label on the anchor', () => {
      const link = { name: 'Test App', url: 'https://example.com' };
      const li = createLinkItem(link);
      const a = li.querySelector('a');

      expect(a.getAttribute('aria-label')).toContain('Test App');
    });

    it('renders icon when provided', () => {
      const link = { name: 'Test', url: 'https://example.com', icon: 'icon/test.svg' };
      const li = createLinkItem(link);
      const img = li.querySelector('img.site-icon');

      expect(img).toBeTruthy();
      expect(img.src).toContain('test.svg');
    });

    it('creates link text with correct name', () => {
      const link = { name: 'My Tool', url: 'https://example.com' };
      const li = createLinkItem(link);
      const text = li.querySelector('.link-text');

      expect(text).toBeTruthy();
      expect(text.textContent).toBe('My Tool');
    });

    it('creates tooltip when description is present', () => {
      const link = {
        name: 'Tool',
        url: 'https://example.com',
        description: 'A useful tool'
      };
      const li = createLinkItem(link);
      const tooltip = li.querySelector('.custom-tooltip');

      expect(tooltip).toBeTruthy();
      expect(tooltip.textContent).toContain('A useful tool');
      expect(tooltip.id).toBeTruthy();
    });

    it('sets aria-describedby for tooltip', () => {
      const link = {
        name: 'Tool',
        url: 'https://example.com',
        description: 'A useful tool'
      };
      const li = createLinkItem(link);
      const a = li.querySelector('a');
      const tooltip = li.querySelector('.custom-tooltip');

      expect(a.getAttribute('aria-describedby')).toBe(tooltip.id);
    });

    it('sets data-search attribute', () => {
      const link = { name: 'Chrome', url: 'https://google.com', tags: ['browser', 'web'] };
      const li = createLinkItem(link);

      expect(li.dataset.search).toBeTruthy();
      expect(li.dataset.search).toContain('chrome');
    });
  });

  describe('createCategoryCard', () => {
    it('creates a category card article', () => {
      const card = createCategoryCard('Test Category');

      expect(card.tagName).toBe('ARTICLE');
      expect(card.classList.contains('category-card')).toBe(true);
    });

    it('contains heading with title', () => {
      const card = createCategoryCard('Security');
      const h2 = card.querySelector('h2');

      expect(h2).toBeTruthy();
      expect(h2.textContent).toContain('Security');
    });

    it('includes category icon', () => {
      const card = createCategoryCard('Security');
      const iconSpan = card.querySelector('.category-icon');

      expect(iconSpan).toBeTruthy();
    });
  });

  describe('renderCategoryContent', () => {
    it('renders subcategories', () => {
      const card = createCategoryCard('Test');
      const cat = {
        title: 'Test',
        subcategories: [
          {
            title: 'Sub 1',
            links: [{ name: 'Link1', url: 'https://a.com', icon: 'icon/a.svg' }]
          }
        ]
      };
      renderCategoryContent(cat, card);

      const subContainer = card.querySelector('.sub-category-container');
      expect(subContainer).toBeTruthy();
    });

    it('renders flat links when no subcategories', () => {
      const card = createCategoryCard('Test');
      const cat = {
        title: 'Test',
        links: [{ name: 'Link1', url: 'https://a.com', icon: 'icon/a.svg' }]
      };
      renderCategoryContent(cat, card);

      const ul = card.querySelector('ul');
      expect(ul).toBeTruthy();
    });
  });
});

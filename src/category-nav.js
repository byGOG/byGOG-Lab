// Category icons mapping
const categoryIcons = {
    'favorilerim': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z"/></svg>',
    'sistem/ofis': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    'sistem araçları & bakım': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    'güvenlik & gizlilik': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'yazılım & paket yöneticileri': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    'internet & tarayıcı': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    'medya & indirme': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    'geliştirici & tasarım': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'uygulamalar & araçlar': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    'mobil & iletişim': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    'oyun': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>'
};

function getCategoryIcon(title) {
    const key = title.toLowerCase().trim();
    for (const [k, v] of Object.entries(categoryIcons)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    // Default icon
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
}

let navCleanup = null;

export function initCategoryNav() {
    const header = document.querySelector('.site-header');
    const container = document.querySelector('.container');
    if (!header || !container) return;

    const cats = document.querySelectorAll('.category-card h2');
    if (!cats.length) return;

    if (typeof navCleanup === 'function') {
        try { navCleanup(); } catch { }
        navCleanup = null;
    }

    // Remove existing if any (re-run safety)
    document.querySelectorAll('.category-nav, .category-nav-spacer').forEach(el => el.remove());

    const nav = document.createElement('nav');
    nav.className = 'category-nav';
    const spacer = document.createElement('div');
    spacer.className = 'category-nav-spacer';

    const sections = [];
    const sectionMap = new Map();
    let clickScrolling = false;

    // Enable click-drag scrolling for the nav (mouse-friendly) without breaking clicks
    let isPointerDown = false;
    let isDragging = false;
    let startX = 0;
    let startScroll = 0;
    let suppressClick = false;

    nav.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        isPointerDown = true;
        isDragging = false;
        startX = e.clientX;
        startScroll = nav.scrollLeft;
    });

    nav.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;
        const dx = e.clientX - startX;
        if (!isDragging && Math.abs(dx) > 4) {
            isDragging = true;
            nav.style.cursor = 'grabbing';
        }
        if (isDragging) {
            nav.scrollLeft = startScroll - dx;
        }
    });

    const stopDrag = () => {
        if (!isPointerDown) return;
        isPointerDown = false;
        if (isDragging) {
            suppressClick = true;
            setTimeout(() => { suppressClick = false; }, 150);
        }
        isDragging = false;
        nav.style.cursor = 'grab';
    };
    nav.addEventListener('pointerup', stopDrag);
    nav.addEventListener('pointercancel', stopDrag);
    nav.addEventListener('click', (e) => {
        if (suppressClick) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick = false;
        }
    }, true);

    const buttons = [];
    const slugCounts = new Map();
    const slugToSection = new Map();
    const slugify = (value) => {
        const base = String(value || "")
            .trim()
            .toLocaleLowerCase("tr")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ı/g, "i")
            .replace(/&/g, " ")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return base || "kategori";
    };
    const uniqueSlug = (value, fallback) => {
        const base = slugify(value || fallback);
        const count = slugCounts.get(base) || 0;
        if (!count) {
            slugCounts.set(base, 1);
            return base;
        }
        const next = count + 1;
        slugCounts.set(base, next);
        return `${base}-${next}`;
    };
    const setHash = (slug, replace = true) => {
        try {
            const url = new URL(window.location.href);
            url.hash = slug ? slug : "";
            if (replace) history.replaceState(null, "", url.toString());
            else history.pushState(null, "", url.toString());
        } catch {
            if (slug) window.location.hash = slug;
        }
    };
    const getHash = () => {
        try {
            return decodeURIComponent(window.location.hash || "").replace(/^#/, "").trim();
        } catch {
            return (window.location.hash || "").replace(/^#/, "").trim();
        }
    };
    const navOffset = () => {
        const navRect = nav.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const bottom = Math.max(navRect.bottom, headerRect.bottom);
        return Math.ceil(bottom + 12);
    };
    const activate = (btn) => {
        buttons.forEach(b => b.classList.toggle('active', b === btn));
    };
    const scrollToSection = (entry, opts = {}) => {
        if (!entry || !entry.h2) return false;
        const off = navOffset();
        const top = entry.h2.getBoundingClientRect().top + window.scrollY - off;
        clickScrolling = true;
        window.scrollTo({ top, behavior: opts.behavior || 'smooth' });
        if (entry.btn) activate(entry.btn);
        if (opts.updateHash) setHash(entry.slug, true);
        setTimeout(() => { clickScrolling = false; }, 800);
        return true;
    };

    cats.forEach(h2 => {
        const card = h2.closest('.category-card');
        const id = `cat-${buttons.length}`;
        const slug = uniqueSlug(h2.textContent, id);
        if (card) {
            card.setAttribute('data-cat-id', id);
            card.setAttribute('data-cat-slug', slug);
        }

        const btn = document.createElement('button');
        btn.className = 'nav-item';
        
        // Add icon
        const icon = document.createElement('span');
        icon.className = 'nav-item-icon';
        icon.innerHTML = getCategoryIcon(h2.textContent);
        btn.appendChild(icon);
        
        // Add text
        const text = document.createElement('span');
        text.className = 'nav-item-text';
        text.textContent = h2.textContent;
        btn.appendChild(text);
        
        btn.onclick = () => {
            scrollToSection({ h2, btn, slug }, { updateHash: true });
        };
        if (card) {
            sections.push({ card, btn, id, h2, slug });
            sectionMap.set(id, btn);
            slugToSection.set(slug, { card, btn, h2, slug });
        }
        buttons.push(btn);
        nav.appendChild(btn);
    });

    if (buttons.length) activate(buttons[0]);

    // Insert spacer to preserve flow, then fixed nav
    header.parentNode.insertBefore(spacer, header.nextSibling);
    spacer.parentNode.insertBefore(nav, spacer.nextSibling);

    const syncSpacer = () => {
        spacer.style.height = `${nav.getBoundingClientRect().height + 12}px`;
    };
    requestAnimationFrame(syncSpacer);
    const onResize = () => syncSpacer();
    window.addEventListener('resize', onResize);

    // Observe scroll position to sync active nav with visible section
    let observer = null;
    if (sections.length) {
        observer = new IntersectionObserver((entries) => {
            if (clickScrolling) return;
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = entry.target.getAttribute('data-cat-id');
                const btn = sectionMap.get(id);
                if (btn) activate(btn);
            });
        }, {
            rootMargin: '-40% 0px -50% 0px',
            threshold: [0.25, 0.5, 0.75]
        });
        sections.forEach(({ card }) => { if (card) observer.observe(card); });
    }

    const syncHashToView = (opts = {}) => {
        const slug = getHash();
        if (!slug) return false;
        const entry = slugToSection.get(slug);
        if (!entry) return false;
        return scrollToSection(entry, { behavior: opts.behavior || 'auto', updateHash: false });
    };

    // Handle initial hash navigation after layout settles.
    requestAnimationFrame(() => {
        setTimeout(() => { syncHashToView({ behavior: 'auto' }); }, 0);
    });
    const onHashChange = () => {
        if (clickScrolling) return;
        syncHashToView({ behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);

    // Insert inside container, before links-container? 
    // Or after header? 
    // Sticky needs to be relative to parent. If inside container, should be fine?
    // Container has flex-col.
    // Insert after header (which is inside container).
    header.parentNode.insertBefore(nav, header.nextSibling);

    navCleanup = () => {
        try { if (observer) observer.disconnect(); } catch { }
        try { window.removeEventListener('resize', onResize); } catch { }
        try { window.removeEventListener('hashchange', onHashChange); } catch { }
    };
}

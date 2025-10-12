// Adds an info button and click-to-open tooltip to each link item
// Works alongside existing anchor-level custom-tooltip (which remains hidden via CSS)

function enhanceInfoTooltips() {
  const container = document.getElementById('links-container');
  if (!container) return;

  const anchors = container.querySelectorAll('.category-card li a');
  anchors.forEach(a => {
    if (a.querySelector('button.info-button')) return; // already enhanced
    const tip = a.querySelector('span.custom-tooltip');
    if (!tip) return; // only enhance items that have a description

    // Build info button
    const infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'info-button';
    infoBtn.setAttribute('aria-expanded', 'false');
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = 'Bilgiyi göster';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    svg.innerHTML = '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"></circle><circle cx="12" cy="8" r="1.4" fill="currentColor"></circle><path d="M12 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>';
    infoBtn.appendChild(svg);
    infoBtn.appendChild(sr);

    // Build new tooltip container
    const infoTip = document.createElement('span');
    infoTip.className = 'info-tooltip';
    infoTip.setAttribute('role', 'tooltip');

    // Try to copy image from existing tooltip, if any
    try {
      const oldImg = tip.querySelector('img');
      if (oldImg) {
        const ii = document.createElement('img');
        ii.width = 24; ii.height = 24;
        ii.decoding = 'async'; ii.loading = 'lazy';
        const ds = oldImg.getAttribute('data-src');
        const src = ds || oldImg.getAttribute('src');
        if (ds) ii.setAttribute('data-src', ds); else if (src) ii.src = src;
        const onerr = () => { if (ii.src && !ii.src.endsWith('/icon/fallback.svg') && !ii.src.endsWith('icon/fallback.svg')) ii.src = 'icon/fallback.svg'; };
        ii.onerror = onerr;
        const alt = oldImg.getAttribute('alt'); if (alt) ii.alt = alt;
        infoTip.appendChild(ii);
      }
    } catch {}

    // Add site name (from label)
    try {
      const label = a.querySelector('.link-text');
      const nameText = (label && label.textContent ? label.textContent : '').trim();
      if (nameText) {
        const nm = document.createElement('span');
        nm.className = 'info-name';
        nm.textContent = nameText;
        infoTip.appendChild(nm);
        infoTip.appendChild(document.createTextNode(' '));
      }
    } catch {}

    // Copy plain text description
    const text = (tip.textContent || '').trim();
    if (text) infoTip.appendChild(document.createTextNode(text));

    // Insert elements: keep near the right edge (after copy button if present)
    a.appendChild(infoBtn);
    a.appendChild(infoTip);
  });
}

function setupInfoDelegation() {
  const container = document.getElementById('links-container');
  if (!container || container.dataset.infoBtnDelegation === 'on') return;
  container.dataset.infoBtnDelegation = 'on';

  const closeAll = () => {
    try {
      container.querySelectorAll('li.info-open').forEach(li => {
        li.classList.remove('info-open');
        const btn = li.querySelector('button.info-button[aria-expanded="true"]');
        if (btn) btn.setAttribute('aria-expanded','false');
      });
    } catch {}
  };

  document.addEventListener('click', (e) => {
    try { if (!container.contains(e.target)) closeAll(); } catch {}
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  container.addEventListener('click', (ev) => {
    const target = ev.target;
    if (!target || !target.closest) return;
    const btn = target.closest('button.info-button');
    if (!btn || !container.contains(btn)) return;
    ev.preventDefault();
    ev.stopPropagation();
    const li = btn.closest('li');
    if (!li) return;
    const wasOpen = li.classList.contains('info-open');
    closeAll();
    if (!wasOpen) {
      // Ensure tooltip image is loaded when opening
      try { const tip = btn.nextElementSibling; const img = tip && tip.querySelector && tip.querySelector('img[data-src]'); if (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); } } catch {}
      li.classList.add('info-open');
      btn.setAttribute('aria-expanded','true');
    }
  });

  // Preload info tooltip image when hovering the name text
  try {
    container.addEventListener('mouseover', (ev) => {
      const t = ev.target;
      if (!t || !t.closest) return;
      const label = t.closest('.link-text');
      if (!label || !container.contains(label)) return;
      const a = label.closest('a');
      if (!a) return;
      const tip = a.querySelector('.info-tooltip');
      if (!tip || !tip.querySelector) return;
      const img = tip.querySelector('img[data-src]');
      if (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
    }, { passive: true });
  } catch {}
}

function waitAndEnhance() {
  const container = document.getElementById('links-container');
  if (!container) { document.addEventListener('DOMContentLoaded', waitAndEnhance, { once: true }); return; }
  // Enhance now and also on subsequent DOM changes
  enhanceInfoTooltips();
  try {
    const mo = new MutationObserver(() => { enhanceInfoTooltips(); });
    mo.observe(container, { childList: true, subtree: true });
  } catch {}
  setupInfoDelegation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitAndEnhance);
} else {
  waitAndEnhance();
}

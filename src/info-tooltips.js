// Adds an info button and click-to-open tooltip to each link item
// Works alongside existing anchor-level custom-tooltip (which remains hidden via CSS)
import { t } from './lib/i18n.js';

function stripNativeTitles(root) {
  try {
    const scope = root || document;
    scope.querySelectorAll('.star[title], .copy-button[title], .link-text[title]').forEach(el => {
      el.removeAttribute('title');
    });
  } catch {}
}

// Overlay + global flyout (modal-style, centered on the page)
function ensureInfoOverlay() {
  let overlay = document.getElementById('info-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'info-overlay';
    overlay.className = 'info-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }
  return overlay;
}

function ensureInfoFlyout() {
  const overlay = ensureInfoOverlay();
  let fly = document.getElementById('global-info-flyout');
  if (!fly) {
    fly = document.createElement('div');
    fly.id = 'global-info-flyout';
    fly.className = 'info-flyout';
    fly.setAttribute('role', 'tooltip');
    fly.setAttribute('aria-hidden', 'true');
    overlay.appendChild(fly);
  } else if (fly.parentElement !== overlay) {
    overlay.appendChild(fly);
  }
  return fly;
}

function setInfoFlyoutContentFromTip(tip) {
  const fly = ensureInfoFlyout();
  try {
    fly.innerHTML = '';
    if (!tip) return fly;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'info-flyout-close';
    closeBtn.setAttribute('aria-label', t('info.close'));
    closeBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      // Close li.info-open states too
      document.querySelectorAll('li.info-open').forEach(li => {
        li.classList.remove('info-open');
        const btn = li.querySelector('button.info-button[aria-expanded="true"]');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
      hideInfoFlyout();
    });
    fly.appendChild(closeBtn);

    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'info-flyout-content';

    // Build header row: logo + name side by side
    const header = document.createElement('div');
    header.className = 'info-flyout-header';
    let descText = '';

    tip.childNodes.forEach(node => {
      const clone = node.cloneNode(true);
      if (clone.nodeType === 1 && (clone.tagName === 'IMG' || (clone.classList && clone.classList.contains('info-name')))) {
        header.appendChild(clone);
      } else if (clone.nodeType === 3) {
        // Text node — collect as description
        const t = clone.textContent.trim();
        if (t) descText += (descText ? ' ' : '') + t;
      }
    });

    content.appendChild(header);

    // Add description below header
    if (descText) {
      const desc = document.createElement('div');
      desc.className = 'info-flyout-desc';
      desc.textContent = descText;
      content.appendChild(desc);
    }

    fly.appendChild(content);

    // Ensure any lazy image loads
    try {
      const img = fly.querySelector('img[data-src]');
      if (img) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      }
    } catch {}
  } catch {}
  return fly;
}

function showInfoFlyout(tip, sourceLi) {
  const fly = setInfoFlyoutContentFromTip(tip);
  const overlay = ensureInfoOverlay();
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  fly.classList.add('show');
  fly.setAttribute('aria-hidden', 'false');
  try {
    document.body.classList.add('modal-open');
  } catch {}

  // Make the info-name clickable as a link to the tool's URL
  if (sourceLi) {
    try {
      const nameSpan = fly.querySelector('.info-flyout-content .info-name');
      const sourceA = sourceLi.querySelector('a[href]');
      if (nameSpan && sourceA) {
        const link = document.createElement('a');
        link.href = sourceA.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'info-name info-name-link';
        link.textContent = nameSpan.textContent;
        nameSpan.replaceWith(link);
      }
    } catch {}
  }

  // Add post-install note if available
  if (sourceLi && sourceLi.dataset.postInstallNote) {
    try {
      const content = fly.querySelector('.info-flyout-content');
      if (content) {
        const section = document.createElement('div');
        section.className = 'post-install-section';
        const heading = document.createElement('div');
        heading.className = 'post-install-heading';
        heading.textContent = t('postInstall.title');
        section.appendChild(heading);
        const text = document.createElement('div');
        text.className = 'post-install-text';
        text.textContent = sourceLi.dataset.postInstallNote;
        section.appendChild(text);
        content.appendChild(section);
      }
    } catch {}
  }

  // Add similar tools section
  if (sourceLi) {
    try {
      const subCategory = sourceLi.closest('.sub-category');
      const categoryCard = sourceLi.closest('.category-card');
      const siblings = [];
      const currentName = sourceLi.dataset.nameOriginal || '';

      // Collect from same subcategory first
      if (subCategory) {
        subCategory.querySelectorAll('li[data-name-original]').forEach(li => {
          if (li !== sourceLi && li.dataset.nameOriginal !== currentName) {
            siblings.push(li);
          }
        });
      }

      // If fewer than 3, add from same category
      if (siblings.length < 3 && categoryCard) {
        categoryCard.querySelectorAll('li[data-name-original]').forEach(li => {
          if (
            li !== sourceLi &&
            li.dataset.nameOriginal !== currentName &&
            !siblings.includes(li)
          ) {
            siblings.push(li);
          }
        });
      }

      if (siblings.length > 0) {
        const content = fly.querySelector('.info-flyout-content');
        if (content) {
          const section = document.createElement('div');
          section.className = 'similar-tools-section';
          const heading = document.createElement('div');
          heading.className = 'similar-tools-heading';
          heading.textContent = t('similar.title');
          section.appendChild(heading);
          const list = document.createElement('div');
          list.className = 'similar-tools-list';

          siblings.slice(0, 5).forEach(li => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'similar-tool-chip';
            const img = li.querySelector('.icon-wrapper img');
            if (img) {
              const chipImg = document.createElement('img');
              chipImg.src = img.getAttribute('data-src') || img.src || 'icon/fallback.svg';
              chipImg.alt = '';
              chipImg.width = 14;
              chipImg.height = 14;
              chipImg.onerror = () => {
                chipImg.src = 'icon/fallback.svg';
              };
              chip.appendChild(chipImg);
            }
            chip.appendChild(document.createTextNode(li.dataset.nameOriginal || ''));
            chip.addEventListener('click', ev => {
              ev.stopPropagation();
              // Close current flyout, then open the target's
              hideInfoFlyout();
              document.querySelectorAll('li.info-open').forEach(el => {
                el.classList.remove('info-open');
                const b = el.querySelector('button.info-button[aria-expanded="true"]');
                if (b) b.setAttribute('aria-expanded', 'false');
              });
              // Trigger the target li's info button
              const targetBtn = li.querySelector('button.info-button');
              if (targetBtn) {
                setTimeout(() => targetBtn.click(), 50);
              }
            });
            list.appendChild(chip);
          });

          section.appendChild(list);
          content.appendChild(section);
        }
      }
    } catch {}
  }

  return fly;
}

function hideInfoFlyout() {
  const fly = document.getElementById('global-info-flyout');
  const overlay = document.getElementById('info-overlay');
  if (fly) {
    fly.classList.remove('show');
    fly.setAttribute('aria-hidden', 'true');
  }
  if (overlay) {
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }
  try {
    document.body.classList.remove('modal-open');
  } catch {}
}

function enhanceInfoTooltips() {
  const containers = [document.getElementById('links-container')].filter(Boolean);

  if (!containers.length) return;

  containers.forEach(container => {
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
      sr.textContent = t('info.show');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.innerHTML =
        '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"></circle><circle cx="12" cy="8" r="1.4" fill="currentColor"></circle><path d="M12 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>';
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
          ii.width = 24;
          ii.height = 24;
          ii.decoding = 'async';
          ii.loading = 'lazy';
          const ds = oldImg.getAttribute('data-src');
          const src = ds || oldImg.getAttribute('src');
          if (ds) ii.setAttribute('data-src', ds);
          else if (src) ii.src = src;
          const onerr = () => {
            if (
              ii.src &&
              !ii.src.endsWith('/icon/fallback.svg') &&
              !ii.src.endsWith('icon/fallback.svg')
            ) {
              ii.src = 'icon/fallback.svg';
            }
          };
          ii.onerror = onerr;
          const alt = oldImg.getAttribute('alt');
          if (alt) ii.alt = alt;
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

      // Mark the list item so CSS can reserve space and adjust positioning
      try {
        const li = a.closest('li');
        if (li) li.classList.add('has-info');
      } catch {}
    });
    // Ensure no native hover tooltips remain on created nodes
    stripNativeTitles(container);
  }); // end containers.forEach
}

function setupInfoDelegation() {
  const container = document.getElementById('links-container');
  if (!container) return;
  if (container.dataset.infoBtnDelegation === 'on') return;
  container.dataset.infoBtnDelegation = 'on';
  ensureInfoFlyout();

  const closeAll = () => {
    try {
      // Close in both containers
      document.querySelectorAll('li.info-open').forEach(li => {
        li.classList.remove('info-open');
        const btn = li.querySelector('button.info-button[aria-expanded="true"]');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    } catch {}
    hideInfoFlyout();
  };

  // Direct click on overlay closes flyout
  const overlay = ensureInfoOverlay();
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeAll();
  });

  document.addEventListener('click', e => {
    try {
      const fly = document.getElementById('global-info-flyout');
      const ovl = document.getElementById('info-overlay');
      const inFlyout = !!(fly && fly.contains(e.target));
      const inOverlay = !!(ovl && ovl.contains(e.target));
      const isInfoBtn = !!(e.target.closest && e.target.closest('button.info-button'));
      const isFlyoutClose = !!(e.target.closest && e.target.closest('.info-flyout-close'));
      // Don't interfere with info button clicks or close button
      if (isInfoBtn || isFlyoutClose) return;
      // Don't close if clicking inside flyout content
      if (inFlyout) return;
      // Close if overlay is showing (info is open) and clicking outside flyout
      if (inOverlay || document.querySelector('li.info-open')) {
        closeAll();
      }
    } catch {}
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
  });

  // Info button click handler for a container
  const setupClickHandler = cont => {
    if (!cont) return;
    cont.addEventListener('click', ev => {
      const target = ev.target;
      if (!target || !target.closest) return;
      const btn = target.closest('button.info-button');
      if (!btn || !cont.contains(btn)) return;
      ev.preventDefault();
      ev.stopPropagation();
      const li = btn.closest('li');
      if (!li) return;
      const wasOpen = li.classList.contains('info-open');
      closeAll();
      if (!wasOpen) {
        // Ensure tooltip image is loaded when opening
        let tip;
        try {
          tip = btn.nextElementSibling;
          const img = tip && tip.querySelector && tip.querySelector('img[data-src]');
          if (img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
          }
        } catch {}
        li.classList.add('info-open');
        btn.setAttribute('aria-expanded', 'true');
        try {
          showInfoFlyout(tip, li);
        } catch {}
      }
    });
  };

  setupClickHandler(container);

  // Preload info tooltip image when hovering the name text
  try {
    container.addEventListener(
      'mouseover',
      ev => {
        const t = ev.target;
        if (!t || !t.closest) return;
        const label = t.closest('.link-text');
        if (!label || !container.contains(label)) return;
        const a = label.closest('a');
        if (!a) return;
        const tip = a.querySelector('.info-tooltip');
        if (!tip || !tip.querySelector) return;
        const img = tip.querySelector('img[data-src]');
        if (img) {
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
        }
      },
      { passive: true }
    );
  } catch {}
}

function waitAndEnhance() {
  const container = document.getElementById('links-container');
  if (!container) {
    document.addEventListener('DOMContentLoaded', waitAndEnhance, { once: true });
    return;
  }
  // Enhance now and also on subsequent DOM changes
  enhanceInfoTooltips();
  if (container) stripNativeTitles(container);
  try {
    const mo = new MutationObserver(() => {
      enhanceInfoTooltips();
      if (container) stripNativeTitles(container);
    });
    mo.observe(container, { childList: true, subtree: true });
  } catch {}
  setupInfoDelegation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitAndEnhance);
} else {
  waitAndEnhance();
}

/**
 * PWA install prompt handling and UI
 */

/**
 * Setup PWA install UI
 */
export function setupPWAInstallUI() {
  const state = { deferred: null, installed: false };
  const cfg = { delayMs: 4500, minScroll: 200, snoozeDays: 7 };
  
  const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone);
  
  const isAllowedPath = () => {
    try {
      const p = new URL(window.location.href).pathname;
      return /(?:^|\/)index\.html$/.test(p) || /\/$/.test(p);
    } catch { return true; }
  };
  
  const isSnoozed = () => {
    try { 
      const until = Number(localStorage.getItem('pwaDismissUntil') || '0'); 
      return Date.now() < until; 
    } catch { return false; }
  };
  
  const snooze = () => { 
    try { 
      localStorage.setItem('pwaDismissUntil', String(Date.now() + cfg.snoozeDays * 86400000)); 
    } catch { } 
  };

  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = () => /android/i.test(navigator.userAgent);

  let cardEl = null;
  let miniEl = null;

  const createCard = () => {
    const card = document.createElement('div');
    card.className = 'install-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    card.setAttribute('aria-label', 'Uygulamayı yükle');

    const icon = document.createElement('img');
    icon.className = 'install-icon';
    icon.src = 'icon/bygog-lab-icon.svg';
    icon.alt = '';
    icon.width = 40; icon.height = 40;

    const textWrap = document.createElement('div');
    textWrap.className = 'install-text';
    const title = document.createElement('div');
    title.className = 'install-title';
    title.textContent = 'byGOG\'u yükle';
    const sub = document.createElement('div');
    sub.className = 'install-sub';
    sub.textContent = 'Hızlı erişim için ana ekrana ekle';
    textWrap.appendChild(title);
    textWrap.appendChild(sub);

    const hint = document.createElement('div');
    hint.className = 'install-hint';
    hint.textContent = '';

    const logoBtn = document.createElement('button');
    logoBtn.type = 'button';
    logoBtn.className = 'install-logo-btn';
    logoBtn.setAttribute('aria-label', 'Ana ekrana ekle');
    const logoImg = document.createElement('img');
    logoImg.src = 'icon/bygog-lab-icon.svg';
    logoImg.alt = '';
    logoImg.width = 56; logoImg.height = 56;
    logoImg.className = 'install-logo-img';
    logoBtn.appendChild(logoImg);
    
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'install-close';
    closeBtn.setAttribute('aria-label', 'Kapat');
    closeBtn.innerHTML = '×';

    card.appendChild(icon);
    card.appendChild(textWrap);
    card.appendChild(hint);
    card.appendChild(logoBtn);
    card.appendChild(closeBtn);
    document.body.appendChild(card);

    const hide = () => {
      try { card.classList.remove('visible'); } catch { }
    };

    logoBtn.addEventListener('click', async () => {
      if (state.deferred) {
        try {
          await state.deferred.prompt();
          const choice = await state.deferred.userChoice;
          state.deferred = null;
          if (choice && choice.outcome === 'accepted') hide();
        } catch { }
      } else {
        alert('Uygulamayı ana ekrana eklemek için tarayıcınızın menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.');
      }
    });
    
    closeBtn.addEventListener('click', () => { snooze(); hide(); });

    const updateState = () => {
      const hasPrompt = !!state.deferred;
      if (hasPrompt) logoBtn.classList.add('ready'); 
      else logoBtn.classList.remove('ready');
      
      if (isIOS()) {
        hint.style.display = '';
        hint.textContent = 'Safari: Paylaş menüsü → Ana Ekrana Ekle';
      } else if (!hasPrompt) {
        hint.style.display = '';
        hint.textContent = isAndroid() ? 'Chrome menüsü → Ana ekrana ekle' : 'Tarayıcı menüsü → Ana ekrana ekle';
      } else {
        hint.style.display = 'none';
      }
    };
    
    card._updateInstallState = updateState;
    card._hide = hide;
    updateState();
    return card;
  };

  const createMini = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'install-badge';
    btn.setAttribute('aria-label', 'Ana ekrana ekle');
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const v = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    v.setAttribute('d', 'M12 5v14');
    v.setAttribute('stroke', 'currentColor');
    v.setAttribute('stroke-width', '2.2');
    v.setAttribute('stroke-linecap', 'round');
    v.setAttribute('fill', 'none');
    const h = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    h.setAttribute('d', 'M5 12h14');
    h.setAttribute('stroke', 'currentColor');
    h.setAttribute('stroke-width', '2.2');
    h.setAttribute('stroke-linecap', 'round');
    h.setAttribute('fill', 'none');
    g.appendChild(v); g.appendChild(h); svg.appendChild(g);
    btn.appendChild(svg);
    
    btn.addEventListener('click', async () => {
      if (state.deferred) {
        try {
          await state.deferred.prompt();
          const choice = await state.deferred.userChoice;
          state.deferred = null;
          if (choice && choice.outcome === 'accepted') {
            try { btn.remove(); } catch { }
          }
        } catch { }
      } else {
        showCard();
      }
    });
    
    return btn;
  };

  const showCard = () => {
    if (!cardEl) cardEl = createCard();
    cardEl.classList.add('visible');
  };

  const showMini = () => {
    if (miniEl) return;
    miniEl = createMini();
    
    // Append to .author-fab if it exists, otherwise body
    const fabContainer = document.querySelector('.author-fab');
    if (fabContainer) {
      fabContainer.appendChild(miniEl);
    } else {
      document.body.appendChild(miniEl);
    }
    
    requestAnimationFrame(() => miniEl.classList.add('visible'));
  };

  const maybeShow = () => {
    if (isStandalone() || !isAllowedPath() || isSnoozed() || state.installed) return;
    
    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      showMini();
    };

    setTimeout(trigger, cfg.delayMs);
    
    const onScroll = () => {
      if (window.scrollY >= cfg.minScroll) {
        trigger();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferred = e;
    if (cardEl && cardEl._updateInstallState) cardEl._updateInstallState();
  });

  window.addEventListener('appinstalled', () => {
    state.installed = true;
    state.deferred = null;
    if (cardEl) { try { cardEl.remove(); } catch { } cardEl = null; }
    if (miniEl) { try { miniEl.remove(); } catch { } miniEl = null; }
  });

  maybeShow();
}

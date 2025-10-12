// Animated placeholder for the main search input (CSP-safe, no inline code)
// Effect: type-and-erase cycling hints unless user is typing/focused
(function(){
  function parseBool(v){ if (v==null) return undefined; const s=String(v).toLowerCase(); return s==='1'||s==='true'||s==='yes'; }
  function parseNum(v, d){ const n = Number(v); return Number.isFinite(n) ? n : d; }

  function start() {
    const input = document.getElementById('search-input');
    if (!input) return;

    const ds = input.dataset || {};
    let phrases = undefined;
    try {
      if (ds.phPhrases) {
        if (ds.phPhrases.trim().startsWith('[')) phrases = JSON.parse(ds.phPhrases);
        else phrases = String(ds.phPhrases).split('|').map(s=>s.trim()).filter(Boolean);
      }
    } catch {}

    const cfg = {
      phrases: phrases && phrases.length ? phrases : [
        'İsim veya içerik ara...',
        'Örn: Steam, Rufus, Git',
        'Kısayol: / veya Ctrl+K'
      ],
      defaultText: ds.phDefault || 'İsim veya içerik ara...',
      typeSpeed: parseNum(ds.phSpeed, 70),        // ms between typed chars
      deleteSpeed: parseNum(ds.phDeleteSpeed, 40),// ms between deleted chars
      pauseTicks: parseNum(ds.phPauseTicks, 12),  // internal ticks at ends
      initialDelay: parseNum(ds.phDelay, 1000),   // ms before first tick
      playOnce: parseBool(ds.phOnce) === true,
      onceKey: ds.phOnceKey || 'phAnimPlayed',
      scrollMode: String((ds.phScroll||'')).toLowerCase() === 'true',
      scrollCycles: parseNum(ds.phScrollCycles, 1)
    };

    // Respect "play only once" behavior
    try { if (cfg.playOnce && localStorage.getItem(cfg.onceKey) === '1') { return; } } catch {}

    let idx = 0, pos = 0, dir = 1; // dir: 1 typing, -1 deleting
    let pausedTicks = cfg.pauseTicks; // initial pause
    let finishedOneLoop = false;

    function isBusy(){
      return document.activeElement === input || !!input.value;
    }

    function setPlaceholder(text){
      try { input.setAttribute('placeholder', text); } catch {}
    }

    function tick(){
      if (!input.isConnected) return; // stop if removed
      if (isBusy()) { setPlaceholder(cfg.defaultText); return setTimeout(tick, 600); }

      if (pausedTicks > 0) { pausedTicks--; return setTimeout(tick, 80); }

      const phrase = cfg.phrases[idx] || cfg.defaultText;
      pos += dir;
      if (dir > 0) {
        if (pos >= phrase.length) { pos = phrase.length; dir = -1; pausedTicks = cfg.pauseTicks + 2; }
      } else {
        if (pos <= 0) { pos = 0; dir = 1; idx = (idx + 1) % cfg.phrases.length; pausedTicks = cfg.pauseTicks; finishedOneLoop = true; }
      }
      setPlaceholder(phrase.slice(0, pos));

      // Stop after one full cycle if playOnce
      if (cfg.playOnce && finishedOneLoop && idx === 0 && dir === 1 && pos === 0) {
        try { localStorage.setItem(cfg.onceKey, '1'); } catch {}
        setPlaceholder(cfg.defaultText);
        return; // end
      }

      setTimeout(tick, dir > 0 ? cfg.typeSpeed : cfg.deleteSpeed);
    }

    // Scroll-bound mode helpers
    function getProgress(){
      const el = document.scrollingElement || document.documentElement;
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      return Math.min(1, Math.max(0, el.scrollTop / max));
    }

    function applyScrollProgress(p){
      if (!input.isConnected) return;
      if (document.activeElement === input || input.value) { setPlaceholder(cfg.defaultText); return; }
      const n = Math.max(1, cfg.phrases.length);
      const cyc = Math.max(1, cfg.scrollCycles || 1);
      const u = (p * cyc) % 1;
      const segFloat = u * n;
      const seg = Math.min(n - 1, Math.floor(segFloat));
      const segP = segFloat - seg; // 0..1
      const phrase = cfg.phrases[seg] || cfg.defaultText;
      const wave = 1 - Math.abs(1 - 2*segP); // 0->1->0
      const len = Math.max(0, Math.min(phrase.length, Math.round(phrase.length * wave)));
      setPlaceholder(phrase.slice(0, len));
    }

    function setupScrollMode(){
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { applyScrollProgress(getProgress()); ticking = false; });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      applyScrollProgress(getProgress());

      // Optional: bind mouse wheel on the search input to cycle phrases
      try {
        let wheelIndex = 0;
        let wheelInit = false;
        const n = Math.max(1, cfg.phrases.length);
        const onWheel = (e) => {
          if (document.activeElement === input || input.value) return; // don't interfere while typing
          e.preventDefault();
          e.stopPropagation();
          const dir = (e.deltaY || 0) > 0 ? 1 : -1;
          if (!wheelInit) {
            // Initialize from current scroll-based progress for continuity
            try {
              const cyc = Math.max(1, cfg.scrollCycles || 1);
              const u = ((getProgress() * cyc) % 1);
              const base = Math.min(n - 1, Math.floor(u * n));
              wheelIndex = base;
            } catch {}
            wheelInit = true;
          }
          wheelIndex = (wheelIndex + dir + n) % n;
          const phrase = cfg.phrases[wheelIndex] || cfg.defaultText;
          setPlaceholder(phrase);
        };
        input.addEventListener('wheel', onWheel, { passive: false });
      } catch {}
    }

    // Events to keep UX predictable
    input.addEventListener('focus', () => setPlaceholder(cfg.defaultText));
    input.addEventListener('input', () => { if (input.value) setPlaceholder(''); });
    input.addEventListener('blur', () => { if (!input.value) setPlaceholder(cfg.defaultText); });

    if (cfg.scrollMode) {
      setupScrollMode();
    } else {
      setTimeout(tick, cfg.initialDelay);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

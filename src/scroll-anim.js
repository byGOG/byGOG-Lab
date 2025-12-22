// Scroll-linked parallax (delta-based, viewport-tuned) for header and search
// Elements must have [data-parallax] and can override tuning via data attributes.
// Supported per-element attributes:
//  - data-parallax-amp (px), data-parallax-max (px)
//  - data-parallax-sens(-sm|-md|-lg)
//  - data-parallax-damp(-sm|-md|-lg)
//  - data-parallax-bp-sm (px), data-parallax-bp-md (px)
(function(){
  function num(v, d){ const n = Number(v); return Number.isFinite(n) ? n : d; }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function makeTarget(el){
    const amp = num(el.getAttribute('data-parallax-amp'), 26);
    const t = {
      el,
      varName: el.classList.contains('site-header') ? '--header-parallax' : '--search-parallax',
      amp,
      maxAbs: num(el.getAttribute('data-parallax-max'), amp),
      sensMd: num(el.getAttribute('data-parallax-sens'), 0.18),
      dampMd: num(el.getAttribute('data-parallax-damp'), 0.08),
      sensSm: num(el.getAttribute('data-parallax-sens-sm'), 0.14),
      dampSm: num(el.getAttribute('data-parallax-damp-sm'), 0.12),
      sensLg: num(el.getAttribute('data-parallax-sens-lg'), 0.22),
      dampLg: num(el.getAttribute('data-parallax-damp-lg'), 0.08),
      bpSm: num(el.getAttribute('data-parallax-bp-sm'), 720),
      bpMd: num(el.getAttribute('data-parallax-bp-md'), 1200),
      sens: 0.18,
      damp: 0.08,
      offset: 0
    };
    return t;
  }

  function main(){
    const els = Array.from(document.querySelectorAll('.site-header[data-parallax], .search-container[data-parallax]'));
    if (!els.length) return;

    const root = document.documentElement;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targets = els.map(makeTarget);
    function tuneOne(t){
      const w = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 1024;
      if (w <= t.bpSm) { t.sens = t.sensSm; t.damp = t.dampSm; }
      else if (w <= t.bpMd) { t.sens = t.sensMd; t.damp = t.dampMd; }
      else { t.sens = t.sensLg; t.damp = t.dampLg; }
    }
    function updateTuning(){ targets.forEach(tuneOne); }

    let raf = 0;
    let lastTop = (document.scrollingElement || document.documentElement).scrollTop;
    let lastTs = 0;

    function apply(ts){
      raf = 0;
      if (reduce) {
        try { root.style.setProperty('--search-parallax','0px'); root.style.setProperty('--header-parallax','0px'); } catch {}
        targets.forEach(t => t.offset = 0);
        return;
      }

      const dt = Math.max(0, lastTs ? (ts - lastTs) : 16);
      lastTs = ts;
      let active = false;
      for (const t of targets){
        let factor = Math.exp(-t.damp * (dt / 16.67));
        if (!Number.isFinite(factor)) factor = 0.9;
        t.offset *= factor;
        if (Math.abs(t.offset) < 0.2) t.offset = 0;
        root.style.setProperty(t.varName, Math.round(t.offset) + 'px');
        if (t.offset !== 0) active = true;
      }
      if (active) schedule();
    }

    function schedule(){ if (!raf) raf = requestAnimationFrame(apply); }

    function onScroll(){
      const sc = document.scrollingElement || document.documentElement;
      const top = sc.scrollTop;
      const delta = top - lastTop;
      lastTop = top;
      if (reduce) return;
      if (delta !== 0) {
        for (const t of targets){ t.offset = clamp(t.offset + delta * t.sens, -t.maxAbs, t.maxAbs); }
        schedule();
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { updateTuning(); schedule(); });
    updateTuning();
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main, { once: true });
  else main();
})();

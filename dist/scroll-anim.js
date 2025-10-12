// Scroll-linked parallax for the search container (delta-based, viewport-tuned)
// Attributes:
//  - data-parallax: enable
//  - data-parallax-amp: legacy max amplitude (px, default 26)
//  - data-parallax-max: absolute clamp (px, default = amp)
//  - data-parallax-sens: base sensitivity for medium viewports (default 0.18)
//  - data-parallax-damp: base damping for medium viewports per ~16ms (default 0.08)
//  - data-parallax-sens-sm|md|lg: optional sensitivity per breakpoint
//  - data-parallax-damp-sm|md|lg: optional damping per breakpoint
//  - data-parallax-bp-sm: small breakpoint max width (default 720)
//  - data-parallax-bp-md: medium breakpoint max width (default 1200)
(function(){
  function num(v, d){ const n = Number(v); return Number.isFinite(n) ? n : d; }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function main(){
    const el = document.querySelector('.search-container[data-parallax]');
    if (!el) return;
    const input = document.getElementById('search-input');
    const root = document.documentElement;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const amp = num(el.getAttribute('data-parallax-amp'), 26);
    const maxAbs = num(el.getAttribute('data-parallax-max'), amp);

    const sensMdDef = num(el.getAttribute('data-parallax-sens'), 0.18);
    const dampMdDef = num(el.getAttribute('data-parallax-damp'), 0.08);
    const sensSmDef = num(el.getAttribute('data-parallax-sens-sm'), 0.14);
    const dampSmDef = num(el.getAttribute('data-parallax-damp-sm'), 0.12);
    const sensLgDef = num(el.getAttribute('data-parallax-sens-lg'), 0.22);
    const dampLgDef = num(el.getAttribute('data-parallax-damp-lg'), 0.08);
    const bpSm = num(el.getAttribute('data-parallax-bp-sm'), 720);
    const bpMd = num(el.getAttribute('data-parallax-bp-md'), 1200);

    let sens = sensMdDef;
    let damp = dampMdDef;

    let offset = 0;
    let raf = 0;
    let lastTop = (document.scrollingElement || document.documentElement).scrollTop;
    let lastTs = 0;

    function busy(){ return document.activeElement === input; }

    function updateTuning(){
      const w = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 1024;
      if (w <= bpSm) { sens = sensSmDef; damp = dampSmDef; }
      else if (w <= bpMd) { sens = sensMdDef; damp = dampMdDef; }
      else { sens = sensLgDef; damp = dampLgDef; }
    }

    function apply(ts){
      raf = 0;
      if (reduce) { root.style.setProperty('--search-parallax','0px'); offset = 0; return; }
      if (busy()) { root.style.setProperty('--search-parallax','0px'); offset *= 0.5; return; }

      const dt = Math.max(0, lastTs ? (ts - lastTs) : 16);
      lastTs = ts;
      // Time-based exponential decay toward 0
      let factor = Math.exp(-damp * (dt / 16.67));
      if (!Number.isFinite(factor)) factor = 0.9;
      offset *= factor;
      if (Math.abs(offset) < 0.2) offset = 0;

      root.style.setProperty('--search-parallax', Math.round(offset) + 'px');
      if (offset !== 0) schedule();
    }

    function schedule(){ if (!raf) raf = requestAnimationFrame(apply); }

    function onScroll(){
      const sc = document.scrollingElement || document.documentElement;
      const top = sc.scrollTop;
      const delta = top - lastTop;
      lastTop = top;
      if (reduce) return;
      if (delta !== 0) {
        offset = clamp(offset + delta * sens, -maxAbs, maxAbs);
        schedule();
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { updateTuning(); schedule(); });
    updateTuning();
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main, { once:true });
  else main();
})();

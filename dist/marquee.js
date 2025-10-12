// Auto marquee for long site names (continuous loop)
// Starts when items enter viewport; respects reduced motion
(function(){
  const SPEED_PX_S = 48;           // scroll speed (px/sec)
  const GAP_PX = 28;               // gap between repeated copies
  const MIN_DELTA_PX = 8;          // require some overflow

  function prefersReduce(){
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  function ensureInner(label){
    let st = label._mqState;
    if (!st) {
      st = label._mqState = {
        inner: null,
        copy1: null,
        gap: null,
        copy2: null,
        width1: 0,
        boxW: 0,
        offset: 0,
        raf: 0,
        running: false,
        lastTs: 0,
        io: null
      };
    }
    if (!st.inner) {
      const text = (label.textContent || '').trim();
      if (!text) return null;
      // Build inner loop: [copy1][gap][copy2]
      const inner = document.createElement('span');
      inner.className = 'marquee-inner';
      const c1 = document.createElement('span'); c1.className = 'marquee-copy'; c1.textContent = text;
      const gap = document.createElement('span'); gap.className = 'marquee-gap'; gap.style.display = 'inline-block'; gap.style.width = GAP_PX + 'px';
      const c2 = document.createElement('span'); c2.className = 'marquee-copy'; c2.textContent = text;
      inner.appendChild(c1); inner.appendChild(gap); inner.appendChild(c2);
      // Replace label contents
      label.textContent = '';
      label.appendChild(inner);
      label.classList.add('marquee-auto');
      st.inner = inner; st.copy1 = c1; st.gap = gap; st.copy2 = c2;
    }
    return st;
  }

  function measure(label){
    const st = label._mqState; if (!st || !st.inner) return false;
    st.boxW = label.clientWidth || 0;
    st.width1 = st.copy1 ? st.copy1.offsetWidth : 0;
    const delta = Math.max(0, st.width1 - st.boxW);
    return delta > MIN_DELTA_PX;
  }

  function stop(label){
    const st = label && label._mqState; if (!st) return;
    st.running = false;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0; st.lastTs = 0;
  }

  function tick(label){
    const st = label._mqState; if (!st || !st.inner || !st.running) return;
    const pxPerMs = Math.max(10, SPEED_PX_S) / 1000;
    const step = (ts) => {
      if (!st.running) return;
      const dt = st.lastTs ? Math.min(48, ts - st.lastTs) : 16;
      st.lastTs = ts;
      const loopW = st.width1 + GAP_PX;
      if (loopW <= 0) { st.offset = 0; st.inner.style.transform = 'translateX(0)'; st.raf = requestAnimationFrame(step); return; }
      st.offset += dt * pxPerMs;
      // wrap-around
      if (st.offset >= loopW) st.offset -= loopW;
      st.inner.style.transform = 'translateX(' + (-st.offset) + 'px)';
      st.raf = requestAnimationFrame(step);
    };
    st.raf = requestAnimationFrame(step);
  }

  function start(label){
    if (!label || prefersReduce()) return;
    const st = ensureInner(label); if (!st) return;
    if (!measure(label)) { stop(label); st.offset = 0; st.inner.style.transform = 'translateX(0)'; return; }
    if (st.running) return;
    st.running = true; st.lastTs = 0; tick(label);
  }

  function setup(){
    const host = document.getElementById('links-container');
    if (!host) return;
    const labels = Array.from(host.querySelectorAll('.link-text'));
    if (!labels.length) return;

    const reduce = prefersReduce();
    if (reduce) return;

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;
        if (!el || !el._mqState) return;
        if (entry.isIntersecting) start(el); else stop(el);
      });
    }, { rootMargin: '200px 0px' }) : null;

    labels.forEach(label => {
      ensureInner(label);
      if (io) io.observe(label);
    });

    function refreshAll(){ labels.forEach(label => { if (label._mqState) { measure(label); } }); }
    let rt = 0;
    window.addEventListener('resize', () => { if (rt) cancelAnimationFrame(rt); rt = requestAnimationFrame(refreshAll); });

    // Initial start for visible labels
    labels.forEach(label => { if (!io) start(label); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();

// Time-based gentle bobbing for the search container
// Combines with scroll parallax via CSS var --search-bob
(function(){
  function start(){
    const el = document.querySelector('.search-container[data-float]');
    if (!el) return;
    const input = document.getElementById('search-input');
    const root = document.documentElement;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amp = (n => Number.isFinite(n) ? n : 6)(Number(el.getAttribute('data-float-amp')));
    const periodMs = (n => Number.isFinite(n) && n > 0 ? n : 4000)(Number(el.getAttribute('data-float-ms')));

    let raf = 0, running = true;
    let t0 = undefined;

    function busy(){ return document.activeElement === input || (input && !!input.value); }

    function frame(ts){
      raf = 0;
      if (!running || reduce) { root.style.setProperty('--search-bob', '0px'); return; }
      if (busy()) { root.style.setProperty('--search-bob', '0px'); schedule(); return; }
      if (t0 == null) t0 = ts;
      const dt = (ts - t0) % periodMs; // 0..period
      const phi = (dt / periodMs) * Math.PI * 2; // 0..2pi
      const y = Math.round(Math.sin(phi) * amp);
      root.style.setProperty('--search-bob', y + 'px');
      schedule();
    }

    function schedule(){ if (!raf) raf = requestAnimationFrame(frame); }

    document.addEventListener('visibilitychange', () => {
      running = document.visibilityState === 'visible';
      if (!running) { try { root.style.setProperty('--search-bob','0px'); } catch {} }
      else schedule();
    });

    window.addEventListener('focus', schedule);
    window.addEventListener('blur', schedule);
    if (input) { input.addEventListener('input', schedule); input.addEventListener('focus', schedule); input.addEventListener('blur', schedule); }

    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();


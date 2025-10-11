// Scroll-linked parallax for the search container
// Reads attributes from the element: data-parallax, data-parallax-amp (px)
(function(){
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function main(){
    const el = document.querySelector('.search-container[data-parallax]');
    if (!el) return;
    const input = document.getElementById('search-input');
    const amp = (n => (Number.isFinite(n) ? n : 24))(Number(el.getAttribute('data-parallax-amp')));
    const root = document.documentElement;
    let raf = 0;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function progress(){
      const sc = document.scrollingElement || document.documentElement;
      const max = Math.max(1, sc.scrollHeight - sc.clientHeight);
      return clamp(sc.scrollTop / max, 0, 1);
    }

    function apply(){
      raf = 0;
      if (reduce) { root.style.setProperty('--search-parallax','0px'); return; }
      // If user is typing, freeze to avoid distraction
      if (document.activeElement === input) { root.style.setProperty('--search-parallax','0px'); return; }
      const p = progress();
      const shift = Math.round(p * amp);
      root.style.setProperty('--search-parallax', shift + 'px');
    }

    function schedule(){ if (!raf) raf = requestAnimationFrame(apply); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main, { once:true });
  else main();
})();


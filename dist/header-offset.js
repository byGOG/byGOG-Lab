// Dynamically measure the fixed header height and set a CSS variable
// to offset the content container, preventing overlap with the SoundCloud embed.
(function(){
  function px(n){ return Math.max(0, Math.round(n)) + 'px'; }

  function compute(){
    try{
      const header = document.querySelector('.site-header');
      if (!header) return;
      const rect = header.getBoundingClientRect();
      const styles = getComputedStyle(header);
      const mb = parseFloat(styles.marginBottom || '0') || 0;
      const h = (rect && rect.height) ? rect.height : header.offsetHeight || 120;
      const offset = Math.ceil(h + mb);
      document.documentElement.style.setProperty('--header-offset', px(offset));
    } catch(e) {}
  }

  function init(){
    compute();
    if ('ResizeObserver' in window){
      try{
        const ro = new ResizeObserver(() => compute());
        const header = document.querySelector('.site-header');
        if (header) ro.observe(header);
      } catch {}
    }
    window.addEventListener('resize', compute, { passive: true });
    window.addEventListener('orientationchange', compute);
    // In case fonts/images change header size after load
    window.addEventListener('load', compute, { once: true });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else
    init();
})();


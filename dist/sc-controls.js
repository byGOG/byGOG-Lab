// Simple SoundCloud next control using Widget API
document.addEventListener('DOMContentLoaded', () => {
  try {
    const wrap = document.querySelector('.sc-embed');
    const iframe = wrap && wrap.querySelector('iframe');
    const nextBtn = wrap && wrap.querySelector('.sc-next');
    if (!wrap || !iframe || !nextBtn) return;

    function withWidget(cb){
      const ready = () => {
        try {
          const w = window.SC && window.SC.Widget && window.SC.Widget(iframe);
          if (w) cb(w);
        } catch {}
      };
      if (window.SC && window.SC.Widget) return ready();
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if (window.SC && window.SC.Widget){ clearInterval(t); ready(); }
        else if (tries > 60) { clearInterval(t); }
      }, 100);
    }

    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      withWidget(widget => { try { widget.next(); } catch {} });
    });
  } catch {}
});


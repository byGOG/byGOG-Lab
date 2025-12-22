document.addEventListener('DOMContentLoaded', () => {
  try {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const src = el.getAttribute('data-src');
        if (src) {
          el.src = src;
          el.removeAttribute('data-src');
        }
        io.unobserve(el);
      });
    }, { rootMargin: '200px 0px' }) : null;
    const targets = document.querySelectorAll('img.site-icon[data-src]');
    if (io) {
      targets.forEach(el => io.observe(el));
    } else {
      targets.forEach(el => {
        const src = el.getAttribute('data-src');
        if (!src) return;
        el.src = src;
        el.removeAttribute('data-src');
      });
    }
  } catch {}
});


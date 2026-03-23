export function initBackToTop() {
  const wrap = document.createElement('div');
  wrap.id = 'scroll-nav';

  const btnUp = document.createElement('button');
  btnUp.className = 'scroll-nav-btn scroll-nav-up';
  btnUp.type = 'button';
  btnUp.title = 'Yukarı Çık';
  btnUp.setAttribute('aria-label', 'Yukarı Çık');
  btnUp.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M18 15l-6-6-6 6"/></svg>';
  btnUp.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const btnDown = document.createElement('button');
  btnDown.className = 'scroll-nav-btn scroll-nav-down';
  btnDown.type = 'button';
  btnDown.title = 'Aşağı İn';
  btnDown.setAttribute('aria-label', 'Aşağı İn');
  btnDown.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M6 9l6 6 6-6"/></svg>';
  btnDown.onclick = () =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  wrap.appendChild(btnUp);
  wrap.appendChild(btnDown);
  document.body.appendChild(wrap);

  let ticking = false;
  const update = () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // Show container when scrolled past 300px
    if (scrollY > 300) {
      wrap.classList.add('visible');
    } else {
      wrap.classList.remove('visible');
    }

    // Dim up arrow at top
    btnUp.classList.toggle('dimmed', scrollY < 10);
    // Dim down arrow at bottom
    btnDown.classList.toggle('dimmed', scrollY >= maxScroll - 10);

    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

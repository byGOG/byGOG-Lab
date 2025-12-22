// Click-to-load SoundCloud embed to improve LCP
document.addEventListener('DOMContentLoaded', () => {
  try {
    const wrap = document.querySelector('.sc-embed');
    if (!wrap) return;
    const iframe = wrap.querySelector('iframe');
    if (!iframe) return;

    const src = iframe.getAttribute('data-src');
    // If already has src, just ensure lazy
    if (!src && iframe.getAttribute('src')) {
      try { iframe.setAttribute('loading', 'lazy'); } catch {}
      return;
    }

    // Build a simple cover with a Load button
    const cover = document.createElement('div');
    cover.className = 'sc-cover';
    cover.setAttribute('role', 'region');
    cover.setAttribute('aria-label', 'SoundCloud oynatıcıyı yükle');

    // Compact cover: no text label, icon-only button

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sc-cover-btn sc-cover-icon';
    const img = document.createElement('img');
    img.src = 'icon/soundcloud.svg';
    img.alt = '';
    img.width = 64; img.height = 64;
    img.decoding = 'async'; img.loading = 'lazy';
    btn.appendChild(img);
    btn.setAttribute('aria-label', 'SoundCloud oynatıcıyı yükle');

    const load = () => {
      const real = iframe.getAttribute('data-src');
      if (real && !iframe.getAttribute('src')) {
        try { iframe.setAttribute('src', real); } catch {}
      }
      wrap.classList.add('loaded');
      try { cover.remove(); } catch {}
    };

    btn.addEventListener('click', load);
    cover.addEventListener('click', (e) => { if (e.target !== btn) load(); });
    cover.appendChild(btn);
    wrap.appendChild(cover);

    // Optional: load on first focus via keyboard
    try { cover.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); } }); } catch {}
  } catch {}
});

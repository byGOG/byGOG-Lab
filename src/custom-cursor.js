/**
 * Custom Cursor — Comet Trail
 * Glowing head with a smooth particle tail that follows the mouse.
 * Skipped on touch-only devices.
 */
export function initCustomCursor() {
  if (matchMedia('(hover: none)').matches) return;

  const head = document.createElement('div');
  head.className = 'cur-head';
  document.body.appendChild(head);

  const TRAIL = 10;
  const trails = [];
  for (let i = 0; i < TRAIL; i++) {
    const t = document.createElement('div');
    t.className = 'cur-trail';
    t.style.opacity = String(0.6 - i * 0.055);
    const s = 4 - i * 0.3;
    t.style.width = s + 'px';
    t.style.height = s + 'px';
    t.style.margin = (-s / 2) + 'px 0 0 ' + (-s / 2) + 'px';
    document.body.appendChild(t);
    trails.push({ el: t, x: -80, y: -80 });
  }

  let mx = -80, my = -80;
  let visible = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (!visible) {
      visible = true;
      head.classList.add('cur-visible');
      trails.forEach(t => t.el.classList.add('cur-visible'));
    }
  }, { passive: true });

  const lerp = (a, b, f) => a + (b - a) * f;

  (function animate() {
    head.style.transform = `translate(${mx}px, ${my}px)`;

    let px = mx, py = my;
    for (let i = 0; i < TRAIL; i++) {
      const t = trails[i];
      const speed = 0.22 - i * 0.017;
      t.x = lerp(t.x, px, speed);
      t.y = lerp(t.y, py, speed);
      t.el.style.transform = `translate(${t.x}px, ${t.y}px)`;
      px = t.x;
      py = t.y;
    }

    requestAnimationFrame(animate);
  })();

  // Interactive states
  const interactiveSelector =
    'a, button, [role="button"], input, textarea, select, label, ' +
    '.nav-item, .copy-button, .info-button, .tag-chip, ' +
    '.scroll-nav-btn, .author-fab-link, .logo-container';

  document.addEventListener('pointerover', e => {
    if (e.target.closest(interactiveSelector)) {
      head.classList.add('cur-hover');
    }
  }, { passive: true });

  document.addEventListener('pointerout', e => {
    if (e.target.closest(interactiveSelector)) {
      head.classList.remove('cur-hover');
    }
  }, { passive: true });

  document.addEventListener('pointerdown', () => {
    head.classList.add('cur-press');
  }, { passive: true });

  document.addEventListener('pointerup', () => {
    head.classList.remove('cur-press');
  }, { passive: true });

  // Window leave/enter
  document.addEventListener('mouseleave', () => {
    visible = false;
    head.classList.remove('cur-visible');
    trails.forEach(t => t.el.classList.remove('cur-visible'));
  });
  document.addEventListener('mouseenter', () => {
    visible = true;
    head.classList.add('cur-visible');
    trails.forEach(t => t.el.classList.add('cur-visible'));
  });
}

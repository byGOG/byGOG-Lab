import { setupCopyDelegation, COPY_ICON_SHAPES } from "./lib/copy-utils.js";

function makeCopyBtn(cmd) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copy-button cmd-copy-btn';
  btn.dataset.copy = cmd;
  btn.dataset.labelDefault = 'Kopyala';
  btn.dataset.labelSuccess = 'Kopyalandı';
  btn.dataset.labelError = 'Kopyalanamadı';
  btn.dataset.labelLoading = 'Kopyalanıyor';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = COPY_ICON_SHAPES.copy;
  btn.appendChild(svg);
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = 'Kopyala';
  btn.appendChild(sr);
  return btn;
}

/**
 * Kategori kartının altına kopyalanabilir komutları ekler.
 * @param {HTMLElement} card - .category-card elementi
 */
export function appendCommandsToCard(card) {
  if (!card || card.querySelector('.card-commands')) return;

  const items = [];
  card.querySelectorAll('li.has-copy').forEach(li => {
    const name = li.querySelector('.link-text')?.textContent?.trim();
    const cmd  = li.querySelector('button.copy-button')?.dataset?.copy;
    if (name && cmd) items.push({ name, cmd });
  });

  if (!items.length) return;

  const section = document.createElement('div');
  section.className = 'card-commands';

  const list = document.createElement('ul');
  list.className = 'card-commands-list';

  items.forEach(({ name, cmd }) => {
    const li = document.createElement('li');
    li.className = 'card-cmd-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'card-cmd-name';
    nameEl.textContent = name;

    const codeEl = document.createElement('code');
    codeEl.className = 'card-cmd-text';
    codeEl.textContent = cmd;

    li.appendChild(nameEl);
    li.appendChild(codeEl);
    li.appendChild(makeCopyBtn(cmd));
    list.appendChild(li);
  });

  section.appendChild(list);
  card.appendChild(section);

  setupCopyDelegation(section);
}

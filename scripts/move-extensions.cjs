/*
  Move specific browser extensions into "Eklenti/Güvenlik" and remove from
  "Tarayıcı/Eklenti" in links.json.
*/
const fs = require('fs');

const FILE = 'links.json';
const TARGET_URLS = new Set([
  'https://github.com/dessant/buster',
  'https://darkreader.org/',
  'https://greasyfork.org/tr',
  'https://immersivetranslate.com/',
  'https://sponsor.ajay.app/'
]);

function findCategory(data, pred) {
  const idx = data.categories.findIndex(pred);
  return [idx, data.categories[idx]];
}

function findSub(cat, pred) {
  const idx = cat.subcategories.findIndex(pred);
  return [idx, cat.subcategories[idx]];
}

function normalize(s){ return String(s).toLowerCase().normalize('NFKD'); }

const json = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const [internetIdx, internet] = findCategory(json, c => normalize(c.title).includes('taray'));
if (!internet) throw new Error('İnternet/Tarayıcı kategorisi bulunamadı');

const [srcIdx, srcSub] = findSub(internet, s => normalize(s.title).includes('taray') && normalize(s.title).includes('eklenti'));
const [dstIdx, dstSub] = findSub(internet, s => normalize(s.title).includes('eklenti') && normalize(s.title).includes('güven'));
if (!srcSub || !dstSub) throw new Error('Alt gruplar bulunamadı');

// Remove from source, collect moved items preserving their existing order
const kept = [];
const moved = [];
for (const l of srcSub.links) {
  if (TARGET_URLS.has(l.url)) moved.push(l); else kept.push(l);
}
srcSub.links = kept;

// Add to destination if missing (by url)
const existing = new Set(dstSub.links.map(l => l.url));
for (const l of moved) {
  if (!existing.has(l.url)) {
    dstSub.links.push(l);
    existing.add(l.url);
  }
}

fs.writeFileSync(FILE, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log('Moved %d item(s) into Eklenti/Güvenlik and removed from Tarayıcı/Eklenti.', moved.length);


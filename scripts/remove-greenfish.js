/*
  Remove Greenfish Icon Editor entry from links.json programmatically
  Usage: node scripts/remove-greenfish.js
*/
const fs = require('fs');

const file = 'links.json';
const raw = fs.readFileSync(file, 'utf8');
const eol = (raw.match(/\r\n/g) || []).length >= (raw.match(/\n/g) || []).length ? '\r\n' : '\n';

const data = JSON.parse(raw);

let removed = 0;

function shouldRemove(link) {
  if (!link || typeof link !== 'object') return false;
  const name = String(link.name || '');
  const url = String(link.url || '');
  return name.trim().toLowerCase() === 'greenfish icon editor' || /greenfishsoftware\.org/i.test(url);
}

function filterLinksArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const before = arr.length;
  const filtered = arr.filter(l => !shouldRemove(l));
  removed += before - filtered.length;
  return filtered;
}

if (Array.isArray(data.categories)) {
  data.categories.forEach(cat => {
    if (Array.isArray(cat.links)) cat.links = filterLinksArray(cat.links);
    if (Array.isArray(cat.subcategories)) {
      cat.subcategories.forEach(sub => {
        if (Array.isArray(sub.links)) sub.links = filterLinksArray(sub.links);
      });
    }
  });
}

const json = JSON.stringify(data, null, 2);
const out = json.replace(/\n/g, eol) + (raw.endsWith('\n') || raw.endsWith('\r\n') ? '' : eol);
fs.writeFileSync(file, out, 'utf8');

console.log(`Removed ${removed} Greenfish entr(y/ies).`);


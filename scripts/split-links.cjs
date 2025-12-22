const fs = require('fs');
const path = require('path');

const DIACRITIC_RE = /[\u0300-\u036f]/g;
function normalizeTr(value) {
  return String(value || '').toLocaleLowerCase('tr');
}
function foldTr(value) {
  try {
    return normalizeTr(value).normalize('NFD').replace(DIACRITIC_RE, '').replace(/\u0131/g, 'i');
  } catch {
    return normalizeTr(value).replace(/\u0131/g, 'i');
  }
}

function enhanceLink(link) {
  const parts = [];
  if (link && link.name) parts.push(String(link.name));
  if (Array.isArray(link && link.tags) && link.tags.length) parts.push(link.tags.join(' '));
  const folded = foldTr(parts.join(' '));
  return { ...link, folded };
}

function enhanceCategory(cat) {
  const next = { ...cat };
  if (Array.isArray(cat.links)) next.links = cat.links.map(enhanceLink);
  if (Array.isArray(cat.subcategories)) {
    next.subcategories = cat.subcategories.map(sub => {
      const subNext = { ...sub };
      if (Array.isArray(sub.links)) subNext.links = sub.links.map(enhanceLink);
      return subNext;
    });
  }
  return next;
}

function splitLinks({ srcPath, indexPath, outDir, basePath }) {
  if (!fs.existsSync(srcPath)) throw new Error('links.json not found');
  const raw = fs.readFileSync(srcPath, 'utf8');
  const data = JSON.parse(raw);
  const categories = Array.isArray(data.categories) ? data.categories : [];

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    categories: [],
    linkIndex: {}
  };

  const addLinkIndex = (link, relPath) => {
    if (!link || !link.name) return;
    if (!index.linkIndex[link.name]) index.linkIndex[link.name] = relPath;
  };

  categories.forEach((cat, i) => {
    const fileName = `links-${String(i + 1).padStart(3, '0')}.json`;
    const relPath = basePath ? `${basePath.replace(/\\/g, '/')}/${fileName}` : fileName;
    const outPath = path.join(outDir, fileName);
    const enhanced = enhanceCategory(cat);
    fs.writeFileSync(outPath, JSON.stringify(enhanced));
    index.categories.push({ title: cat.title || '', file: relPath });

    if (Array.isArray(cat.links)) cat.links.forEach(link => addLinkIndex(link, relPath));
    if (Array.isArray(cat.subcategories)) {
      cat.subcategories.forEach(sub => {
        if (Array.isArray(sub.links)) sub.links.forEach(link => addLinkIndex(link, relPath));
      });
    }
  });

  fs.writeFileSync(indexPath, JSON.stringify(index));
  return index;
}

if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  splitLinks({
    srcPath: path.join(rootDir, 'links.json'),
    indexPath: path.join(rootDir, 'data', 'links-index.json'),
    outDir: path.join(rootDir, 'data', 'links'),
    basePath: 'data/links'
  });
}

module.exports = { splitLinks };

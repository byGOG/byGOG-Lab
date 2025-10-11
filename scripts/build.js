const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let esbuild, csso;
try { esbuild = require('esbuild'); } catch {}
try { csso = require('csso'); } catch {}

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(rootDir, 'index.html');
const swPath = path.join(rootDir, 'sw.js');
const linksSrcPath = path.join(rootDir, 'links.json');
const linksOutPath = path.join(distDir, 'links.json');

fs.mkdirSync(distDir, { recursive: true });

// 1) Copy JS from src -> dist
const files = fs.readdirSync(srcDir).filter(name => name.endsWith('.js'));
files.forEach(file => {
  const from = path.join(srcDir, file);
  const to = path.join(distDir, file);
  fs.copyFileSync(from, to);
  console.log('Copied', from, '->', to);
});

// Build enhanced dist/links.json (minified + precomputed folded)
buildLinksJSON();

// Minify assets where possible before hashing
minifyCSS();
// Await JS minification within an IIFE to keep file sync
let __minifyDone = false;
(async () => { try { await minifyJS(); } finally { __minifyDone = true; } })();
// Busy-wait very briefly if minification hasn't finished (ensures hashing sees minified output)
const startWait = Date.now();
while (!__minifyDone && Date.now() - startWait < 2000) {}

// 1.1) Minify JS (if esbuild is available)
async function minifyJS() {
  if (!esbuild) return;
  const inputs = [
    path.join(distDir, 'renderLinks.js'),
    path.join(distDir, 'searchWorker.js')
  ].filter(p => fs.existsSync(p));
  for (const input of inputs) {
    try {
      const code = fs.readFileSync(input, 'utf8');
      const result = await esbuild.transform(code, { minify: true, format: 'esm', target: 'es2019' });
      fs.writeFileSync(input, result.code);
      console.log('Minified', input);
    } catch (e) {
      console.warn('esbuild failed for', input, e && e.message);
    }
  }
}

// 1.2) Minify CSS (if csso is available)
function minifyCSS() {
  if (!csso) return;
  const cssTargets = [
    path.join(distDir, 'styles.css'),
    path.join(distDir, 'fab.css')
  ];
  cssTargets.forEach(fp => {
    if (!fs.existsSync(fp)) return;
    try {
      const src = fs.readFileSync(fp, 'utf8');
      const { css } = csso.minify(src);
      fs.writeFileSync(fp, css);
      console.log('Minified', fp);
    } catch (e) {
      console.warn('CSS minify failed for', fp, e && e.message);
    }
  });
}

// 2) Build-time search helpers and links.json minify -> dist/links.json
const DIACRITIC_RE = /[\u0300-\u036f]/g;
function normalizeTr(v) { return String(v || '').toLocaleLowerCase('tr'); }
function foldTr(v) {
  try {
    return normalizeTr(v).normalize('NFD').replace(DIACRITIC_RE, '').replace(/ı/g, 'i');
  } catch {
    return normalizeTr(v).replace(/ı/g, 'i');
  }
}

function enhanceLinksForSearch(obj) {
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
    if (Array.isArray(cat.subcategories)) next.subcategories = cat.subcategories.map(enhanceCategory);
    return next;
  }
  const out = { ...obj };
  if (Array.isArray(obj.categories)) out.categories = obj.categories.map(enhanceCategory);
  return out;
}

function buildLinksJSON() {
  if (!fs.existsSync(linksSrcPath)) return;
  try {
    const raw = fs.readFileSync(linksSrcPath, 'utf8');
    const data = JSON.parse(raw);
    const enhanced = enhanceLinksForSearch(data);
    const min = JSON.stringify(enhanced);
    fs.writeFileSync(linksOutPath, min);
    console.log('Wrote', linksOutPath);
  } catch (e) {
    console.warn('Failed to build dist/links.json:', e && e.message);
  }
}
function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

function withHash(filePath, hash) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  return path.join(dir, `${base}.${hash}${ext}`);
}

const targets = [
  path.join(distDir, 'styles.css'),
  path.join(distDir, 'fab.css'),
  path.join(distDir, 'renderLinks.js')
  // Note: keep searchWorker.js stable to match Worker import
];

const manifest = {};
targets.forEach(src => {
  if (!fs.existsSync(src)) return;
  const h = hashFile(src);
  const out = withHash(src, h);
  fs.copyFileSync(src, out);
  manifest[path.relative(rootDir, src).replace(/\\/g, '/')] = path.relative(rootDir, out).replace(/\\/g, '/');
  console.log('Hashed', src, '->', out);
});

// 3) Update index.html references to hashed assets (replace original or old-hash refs)
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const patterns = [
    { base: 'dist/styles', ext: 'css' },
    { base: 'dist/fab', ext: 'css' },
    { base: 'dist/renderLinks', ext: 'js' }
  ];
  patterns.forEach(({ base, ext }) => {
    const origKey = `${base}.${ext}`;
    const hashed = manifest[origKey];
    if (!hashed) return;
    const re = new RegExp(`${base}(?:\\.[0-9a-f]{8})?\\.${ext}`, 'g');
    html = html.replace(re, hashed);
  });
  // Ensure links.json preload points to dist/links.json
  html = html.replace(/href="links\.json"/g, 'href="dist/links.json"');
  fs.writeFileSync(indexPath, html);
  console.log('Updated index.html with hashed assets');
}

// 4) Update sw.js: cache name + urlsToCache with hashed assets
if (fs.existsSync(swPath)) {
  let sw = fs.readFileSync(swPath, 'utf8');
  const manifestHash = crypto.createHash('md5').update(JSON.stringify(manifest)).digest('hex').slice(0, 8);
  sw = sw.replace(/const CACHE_NAME = '.*?';/g, `const CACHE_NAME = 'bygog-lab-cache-${manifestHash}';`);
  const urls = [
    '.',
    'index.html',
    'manifest.json',
    manifest['dist/styles.css'] || 'dist/styles.css',
    manifest['dist/fab.css'] || 'dist/fab.css',
    manifest['dist/renderLinks.js'] || 'dist/renderLinks.js',
    'dist/links.json',
    'icon/bygog-lab-icon.svg',
    'icon/bygog-lab-logo.svg'
  ];
  sw = sw.replace(/const urlsToCache = \[[\s\S]*?\];/g, `const urlsToCache = [\n  ${urls.map(u => `'${u}'`).join(',\n  ')}\n];`);
  fs.writeFileSync(swPath, sw);
  console.log('Updated sw.js cache name and urlsToCache');
}

// 5) Clean old hashed artifacts (retain latest only)
function cleanOldHashed(baseName, ext, keepPath) {
  const base = path.join(distDir, `${baseName}`);
  const files = fs.readdirSync(distDir);
  const re = new RegExp(`^${baseName}\\.[0-9a-f]{8}\\.${ext}$`);
  files.forEach(f => {
    if (re.test(f)) {
      const full = path.join(distDir, f);
      if (path.relative(distDir, keepPath) !== f) {
        try { fs.unlinkSync(full); console.log('Removed old hashed', full); } catch {}
      }
    }
  });
}

try {
  if (manifest['dist/styles.css']) cleanOldHashed('styles', 'css', path.join(rootDir, manifest['dist/styles.css']));
  if (manifest['dist/fab.css']) cleanOldHashed('fab', 'css', path.join(rootDir, manifest['dist/fab.css']));
  if (manifest['dist/renderLinks.js']) cleanOldHashed('renderLinks', 'js', path.join(rootDir, manifest['dist/renderLinks.js']));
} catch {}

// 6) Write asset manifest for debugging/reference
fs.writeFileSync(path.join(distDir, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Wrote dist/asset-manifest.json');

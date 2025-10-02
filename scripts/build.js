const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(rootDir, 'index.html');
const swPath = path.join(rootDir, 'sw.js');

fs.mkdirSync(distDir, { recursive: true });

// 1) Copy JS from src -> dist
const files = fs.readdirSync(srcDir).filter(name => name.endsWith('.js'));
files.forEach(file => {
  const from = path.join(srcDir, file);
  const to = path.join(distDir, file);
  fs.copyFileSync(from, to);
  console.log('Copied', from, '->', to);
});

// 2) Hash selected assets and write hashed copies
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
    'links.json',
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

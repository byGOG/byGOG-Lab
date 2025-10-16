/*
  Enrich missing tags in links.json using simple heuristics.
  - Keeps existing tags intact
  - Derives tags from name/description/url
  - Adds common Turkish synonyms (vpn, tarayıcı, paket yöneticisi, vb.)
  Usage: node scripts/enrich-tags.js
*/
const fs = require('fs');
const path = require('path');

const FILE = path.resolve('links.json');

function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJSON(p, obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n'); }

const STOP = new Set([
  'www','com','net','org','io','dev','app','site','page','official','resmi','download','indir',
  'www2','www3','tools','tool','plus','setup','site','home','docs','help','support','blog'
]);

function normalizeTr(v){ try { return String(v||'').toLocaleLowerCase('tr'); } catch { return String(v||'').toLowerCase(); } }
function foldTr(v){
  const s = normalizeTr(v);
  try { return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i'); } catch { return s.replace(/ı/g,'i'); }
}

function tokenize(s){
  const f = foldTr(s).replace(/[^a-z0-9çğıöşü\-\s]/g,' ').replace(/\s+/g,' ').trim();
  const out = [];
  for (const tok of f.split(' ')){
    if (!tok || STOP.has(tok)) continue;
    if (tok.length < 3) continue;
    if (/^\d+$/.test(tok)) continue;
    out.push(tok);
  }
  return out;
}

const KEYWORD_TAGS = [
  { rx: /\bvpn\b/i, tags: ['vpn','gizlilik'] },
  { rx: /\b(password|şifre|parola)\b/i, tags: ['şifre yöneticisi','parola'] },
  { rx: /\b(browser|taray[ıi]c[ıi]|chrome|firefox|brave|edge)\b/i, tags: ['tarayıcı'] },
  { rx: /\b(editor|editör|ide|kod|code)\b/i, tags: ['editör'] },
  { rx: /\b(arşiv|archive|7-?zip|zip|rar)\b/i, tags: ['arşiv','sıkıştırma'] },
  { rx: /\b(video|media|oynat[ıi]c[ıi]|vlc)\b/i, tags: ['oynatıcı','video'] },
  { rx: /\b(music|müzik|spotify)\b/i, tags: ['müzik'] },
  { rx: /\b(remote|uzaktan|teamviewer|rustdesk)\b/i, tags: ['uzaktan erişim'] },
  { rx: /\b(usb|iso|boot|rufus)\b/i, tags: ['usb','iso','önyükleme'] },
  { rx: /\b(package|paket|manager|yönetic[ie]si|winget|scoop)\b/i, tags: ['paket yöneticisi'] },
  { rx: /\b(sürüc[üu]|driver)\b/i, tags: ['sürücü','güncelleme'] },
  { rx: /\b(güvenlik|security|antivir[üu]s|mahremiyet|privacy)\b/i, tags: ['güvenlik','gizlilik'] },
  { rx: /\b(e-?posta|email|gmail|outlook|yahoo)\b/i, tags: ['e-posta'] },
  { rx: /\b(bulut|cloud|one-?drive|google ?drive|dropbox)\b/i, tags: ['bulut'] },
  { rx: /\b(screenshot|ekran|sharex)\b/i, tags: ['ekran görüntüsü'] },
  { rx: /\b(ssh|git|repo|version control|sürüm)\b/i, tags: ['versiyon kontrol'] },
  { rx: /\b(windows|office)\b/i, tags: ['windows'] },
];

function extractDomainTags(url){
  try {
    const u = new URL(url);
    const parts = u.hostname.split('.').filter(Boolean);
    const core = parts.filter(p => !STOP.has(p) && p.length > 2);
    return core.slice(0,2);
  } catch { return []; }
}

function distinctPreserve(arr){
  const out = []; const seen = new Set();
  for (const x of arr){ const k = normalizeTr(x); if (k && !seen.has(k)) { seen.add(k); out.push(x); } }
  return out;
}

function suggestTags(link){
  const name = String(link.name||'');
  const desc = String(link.description||'');
  const url = String(link.url||'');
  const tokens = tokenize(name).slice(0,3);
  const domain = extractDomainTags(url);
  const doc = `${name} ${desc} ${url}`;
  const keywordTags = [];
  for (const {rx,tags} of KEYWORD_TAGS){ if (rx.test(doc)) keywordTags.push(...tags); }
  const all = distinctPreserve([...tokens, ...keywordTags, ...domain]).slice(0,6);
  return all;
}

function enrichLinks(obj, rewrite=false){
  const alter = (l) => {
    if (!l || typeof l !== 'object') return;
    if (rewrite || !Array.isArray(l.tags) || l.tags.length === 0){
      const tags = suggestTags(l);
      if (tags.length) l.tags = tags;
      else l.tags = [];
    }
  };
  if (Array.isArray(obj.links)) obj.links.forEach(alter);
  if (Array.isArray(obj.subcategories)) obj.subcategories.forEach(sc => enrichLinks(sc, rewrite));
}

function main(){
  const data = readJSON(FILE);
  if (!data || !Array.isArray(data.categories)){
    console.error('Invalid links.json format.');
    process.exit(1);
  }
  const rewrite = process.env.ENRICH_REWRITE === '1' || process.argv.includes('--rewrite');
  data.categories.forEach(cat => enrichLinks(cat, rewrite));
  writeJSON(FILE, data);
  console.log('Enriched tags for links with missing/empty tags.');
}

main();

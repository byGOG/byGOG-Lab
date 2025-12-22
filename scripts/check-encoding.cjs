/*
  Simple encoding/mojibake scanner.
  Scans repo files and fails on common UTF-8 mis-decoding patterns,
  plus stray C1 control characters.
*/
const fs = require('fs');
const path = require('path');

const exts = new Set(['.json', '.js', '.html', '.css', '.md']);
const ignoreDirs = new Set(['.git', 'node_modules', 'dist-assets']);

const patternSources = [
  '\\uFFFD',      // replacement char
  '[\\u0080-\\u009F]', // C1 controls (often mojibake)
  '\\u00C3.',    // common UTF-8->1252 leftovers (e.g., \u00C3\u00B6)
  '\\u00C2',     // stray \u00C2 from non-breaking space
  '\\u00C4.',    // e.g., \u00C4\u00B1, \u00C4\u009F
  '\\u00C5.'     // e.g., \u00C5\u009F, \u00C5\u009E
];
const patterns = patternSources.map(src => new RegExp(src, 'g'));

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (!ignoreDirs.has(name)) walk(p, out);
    } else {
      const ext = path.extname(name).toLowerCase();
      if (exts.has(ext)) out.push(p);
    }
  }
  return out;
}

const files = walk(process.cwd());
let issues = 0;

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const rx of patterns) {
    if (rx.test(text)) {
      console.error(`MOJIBAKE ${f}: pattern ${rx}`);
      issues++;
      break; // report once per file to keep log short
    }
  }
}

if (issues) {
  console.error(`\nEncoding check failed: ${issues} file(s) contain mojibake.`);
  process.exit(1);
}

console.log('Encoding check OK (UTF-8, no mojibake patterns found)');

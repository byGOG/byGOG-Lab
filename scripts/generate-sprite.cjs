/**
 * Generate SVG sprite sheet from icon/ directory
 * Creates dist/icons-sprite.svg with <symbol> elements
 * Usage: node scripts/generate-sprite.cjs
 */

const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, '..', 'icon');
const outPath = path.join(__dirname, '..', 'dist', 'icons-sprite.svg');

// Icons to exclude from sprite (used directly elsewhere)
const EXCLUDE = new Set([
  'bygog-lab-icon.svg',
  'bygog-lab-logo.svg',
  'fallback.svg',
  'soundcloud.svg'
]);

function generateSprite() {
  if (!fs.existsSync(iconDir)) {
    console.warn('icon/ directory not found');
    return;
  }

  const MAX_SIZE = 5 * 1024; // Only include SVGs under 5KB (simple vector icons)
  const files = fs
    .readdirSync(iconDir)
    .filter(f => {
      if (!f.endsWith('.svg') || EXCLUDE.has(f)) return false;
      const stat = fs.statSync(path.join(iconDir, f));
      return stat.size <= MAX_SIZE;
    })
    .sort();

  const symbols = [];

  for (const file of files) {
    const id = path.basename(file, '.svg');
    const content = fs.readFileSync(path.join(iconDir, file), 'utf8');

    // Extract viewBox from SVG
    const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

    // Extract inner content (everything between <svg> and </svg>)
    const innerMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    if (!innerMatch) continue;

    const inner = innerMatch[1].trim();
    if (!inner) continue;

    symbols.push(`  <symbol id="${id}" viewBox="${viewBox}">${inner}</symbol>`);
  }

  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, sprite);

  console.log(`Generated sprite with ${symbols.length} icons -> ${outPath}`);
  console.log(`Size: ${(Buffer.byteLength(sprite) / 1024).toFixed(1)} KB`);
}

generateSprite();

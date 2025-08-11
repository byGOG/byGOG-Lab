const fs = require('fs');
const path = require('path');
let CleanCSS;
let terser;
try {
  CleanCSS = require('clean-css');
} catch {
  console.warn('clean-css not installed, using basic CSS minifier');
}
try {
  terser = require('terser');
} catch {
  console.warn('terser not installed, using basic JS minifier');
}

function basicMinifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .trim();
}

function basicMinifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s*([{};:,=()<>+\-\*\[\]])\s*/g, '$1')
    .trim();
}

async function build() {
  try {
    fs.mkdirSync('dist', { recursive: true });

    const css = fs.readFileSync('styles.css', 'utf8');
    const minifiedCSS = CleanCSS ? new CleanCSS().minify(css).styles : basicMinifyCSS(css);
    fs.writeFileSync(path.join('dist', 'styles.css'), minifiedCSS + '\n');

    const dir = 'scripts';
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith('.js')) {
          const code = fs.readFileSync(path.join(dir, file), 'utf8');
          const minified = terser ? (await terser.minify(code)).code : basicMinifyJS(code);
          fs.writeFileSync(path.join('dist', file), minified + '\n');
        }
      }
    }
  } catch (err) {
    console.error('Build failed:', err);
  }
}

build();


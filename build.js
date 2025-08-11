const fs = require('fs');
const path = require('path');

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .trim();
}

function minifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s*([{};:,=()<>+\-\*\[\]])\s*/g, '$1')
    .trim();
}

function build() {
  fs.mkdirSync('dist', { recursive: true });

  const css = fs.readFileSync('styles.css', 'utf8');
  fs.writeFileSync(path.join('dist', 'styles.css'), minifyCSS(css));

  const dir = 'scripts';
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.js')) {
        const code = fs.readFileSync(path.join(dir, file), 'utf8');
        fs.writeFileSync(path.join('dist', file), minifyJS(code));
      }
    }
  }
}

build();

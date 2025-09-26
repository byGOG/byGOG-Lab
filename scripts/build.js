const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

fs.mkdirSync(distDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter(name => name.endsWith('.js'));
files.forEach(file => {
  const from = path.join(srcDir, file);
  const to = path.join(distDir, file);
  fs.copyFileSync(from, to);
  console.log('Copied', from, '->', to);
});

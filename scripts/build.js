// Minimal build: copy readable source to dist
// No external dependencies; safe under restricted network
const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'src', 'renderLinks.js');
const distDir = path.join(__dirname, '..', 'dist');
const distFile = path.join(distDir, 'renderLinks.js');

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(srcFile, distFile);
console.log('Copied', srcFile, '->', distFile);


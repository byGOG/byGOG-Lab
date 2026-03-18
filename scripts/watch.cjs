const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const assetsDir = path.join(rootDir, 'assets');

let debounce = null;
let building = false;

function rebuild() {
  if (building) return;
  building = true;
  const time = new Date().toLocaleTimeString();
  console.log(`\n[${time}] Rebuilding...`);
  try {
    execSync('node scripts/build.cjs', {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
  } catch (e) {
    console.error('Build failed:', e.message);
  } finally {
    building = false;
  }
}

[srcDir, assetsDir].forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { recursive: true }, (_event, filename) => {
    if (!filename || filename.endsWith('~')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      console.log(`\nChanged: ${filename}`);
      rebuild();
    }, 200);
  });
});

console.log('Watching src/ and assets/ for changes...');
rebuild();

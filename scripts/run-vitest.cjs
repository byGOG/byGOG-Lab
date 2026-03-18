const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const bin = path.join(root, 'node_modules', 'vitest', 'vitest.mjs');
const args = process.argv.slice(2);

const env = { ...process.env };
delete env.NODE_OPTIONS;
env.NODE_NO_WARNINGS = '1';

const child = spawn(process.execPath, [bin, ...args], { stdio: 'inherit', env });
child.on('error', err => {
  console.error('Failed to start vitest:', err);
  process.exit(1);
});
child.on('exit', code => {
  process.exit(code ?? 1);
});

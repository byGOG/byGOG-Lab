import { promises as fs } from 'node:fs';
import path from 'node:path';
import sax from 'sax';
import { optimize } from 'svgo';

sax.MAX_BUFFER_LENGTH = 1024 * 1024 * 1024;

const roots = ['icon', 'docs'];

async function collectSvgFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectSvgFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeFile(file) {
  const original = await fs.readFile(file, 'utf8');
  const result = optimize(original, {
    path: file,
    multipass: true,
  });
  if (result.error) {
    throw new Error(`SVGO failed for ${file}: ${result.error}`);
  }
  if (result.data !== original) {
    await fs.writeFile(file, result.data, 'utf8');
  }
}

async function main() {
  const existingRoots = [];
  for (const root of roots) {
    try {
      const stats = await fs.stat(root);
      if (stats.isDirectory()) {
        existingRoots.push(root);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  const files = [];
  for (const root of existingRoots) {
    files.push(...await collectSvgFiles(root));
  }

  for (const file of files) {
    await optimizeFile(file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * Bundle Analizi Script'i
 * Build sonrası dosya boyutlarını raporlar
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'assets');
const srcDir = path.join(rootDir, 'src');

// ANSI renk kodları
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getGzipSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return zlib.gzipSync(content).length;
  } catch {
    return 0;
  }
}

function getBrotliSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return zlib.brotliCompressSync(content).length;
  } catch {
    return 0;
  }
}

function getFilesInDir(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  
  return fs.readdirSync(dir)
    .filter(file => extensions.some(ext => file.endsWith(ext)))
    .map(file => ({
      name: file,
      path: path.join(dir, file),
      size: fs.statSync(path.join(dir, file)).size
    }));
}

function printHeader(title) {
  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.cyan + ' ' + title + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);
}

function printFileRow(file, showCompressed = true) {
  const gzip = getGzipSize(file.path);
  const brotli = getBrotliSize(file.path);
  
  const sizeColor = file.size > 100000 ? colors.red : 
                    file.size > 50000 ? colors.yellow : colors.green;
  
  let row = `  ${colors.dim}•${colors.reset} ${file.name.padEnd(30)} `;
  row += `${sizeColor}${formatBytes(file.size).padStart(10)}${colors.reset}`;
  
  if (showCompressed) {
    row += `  ${colors.dim}gzip:${colors.reset} ${formatBytes(gzip).padStart(8)}`;
    row += `  ${colors.dim}br:${colors.reset} ${formatBytes(brotli).padStart(8)}`;
  }
  
  console.log(row);
}

function printSummary(files, label) {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalGzip = files.reduce((sum, f) => sum + getGzipSize(f.path), 0);
  const totalBrotli = files.reduce((sum, f) => sum + getBrotliSize(f.path), 0);
  
  console.log(colors.dim + '  ' + '─'.repeat(56) + colors.reset);
  console.log(`  ${colors.bright}${label.padEnd(30)}${colors.reset} ` +
    `${colors.bright}${formatBytes(totalSize).padStart(10)}${colors.reset}  ` +
    `${colors.dim}gzip:${colors.reset} ${formatBytes(totalGzip).padStart(8)}  ` +
    `${colors.dim}br:${colors.reset} ${formatBytes(totalBrotli).padStart(8)}`);
  
  return { totalSize, totalGzip, totalBrotli };
}

function analyze() {
  console.log('\n' + colors.bright + colors.blue + '📦 Bundle Analizi' + colors.reset);
  console.log(colors.dim + `   ${new Date().toLocaleString('tr-TR')}` + colors.reset);
  
  let grandTotal = { size: 0, gzip: 0, brotli: 0 };
  
  // Dist klasörü (minified)
  if (fs.existsSync(distDir)) {
    printHeader('📁 dist/ (Minified)');
    
    const jsFiles = getFilesInDir(distDir, ['.js']);
    const cssFiles = getFilesInDir(distDir, ['.css']);
    const jsonFiles = getFilesInDir(distDir, ['.json']);
    
    if (jsFiles.length) {
      console.log(colors.yellow + '\n  JavaScript:' + colors.reset);
      jsFiles.forEach(f => printFileRow(f));
    }
    
    if (cssFiles.length) {
      console.log(colors.yellow + '\n  CSS:' + colors.reset);
      cssFiles.forEach(f => printFileRow(f));
    }
    
    if (jsonFiles.length) {
      console.log(colors.yellow + '\n  JSON:' + colors.reset);
      jsonFiles.forEach(f => printFileRow(f));
    }
    
    const allDist = [...jsFiles, ...cssFiles, ...jsonFiles];
    if (allDist.length) {
      const summary = printSummary(allDist, 'Dist Toplam');
      grandTotal.size += summary.totalSize;
      grandTotal.gzip += summary.totalGzip;
      grandTotal.brotli += summary.totalBrotli;
    }
  }
  
  // Assets klasörü (source CSS)
  printHeader('📁 assets/ (Source CSS)');
  const assetsCss = getFilesInDir(assetsDir, ['.css']);
  assetsCss.forEach(f => printFileRow(f));
  const assetsSummary = printSummary(assetsCss, 'Assets Toplam');
  
  // Source JS
  printHeader('📁 src/ (Source JS)');
  const srcJs = getFilesInDir(srcDir, ['.js']);
  srcJs.forEach(f => printFileRow(f));
  const srcSummary = printSummary(srcJs, 'Src Toplam');
  
  // Icon SVG analizi
  const iconDir = path.join(rootDir, 'icon');
  if (fs.existsSync(iconDir)) {
    printHeader('🎨 icon/ (SVG İkonlar)');
    const svgFiles = getFilesInDir(iconDir, ['.svg', '.png']);
    const totalSvgSize = svgFiles.reduce((sum, f) => sum + f.size, 0);
    console.log(`  ${colors.dim}Toplam ${svgFiles.length} dosya${colors.reset}`);
    console.log(`  ${colors.bright}Toplam boyut: ${formatBytes(totalSvgSize)}${colors.reset}`);
    
    // En büyük 5 ikon
    const largest = svgFiles.sort((a, b) => b.size - a.size).slice(0, 5);
    console.log(colors.yellow + '\n  En büyük 5 ikon:' + colors.reset);
    largest.forEach(f => printFileRow(f, false));
  }
  
  // Genel özet
  printHeader('📊 Genel Özet');
  console.log(`  ${colors.green}✓${colors.reset} Dist toplam:   ${formatBytes(grandTotal.size)} (gzip: ${formatBytes(grandTotal.gzip)}, br: ${formatBytes(grandTotal.brotli)})`);
  console.log(`  ${colors.blue}ℹ${colors.reset} Assets CSS:    ${formatBytes(assetsSummary.totalSize)}`);
  console.log(`  ${colors.blue}ℹ${colors.reset} Source JS:     ${formatBytes(srcSummary.totalSize)}`);
  
  // Performans uyarıları
  console.log('\n' + colors.bright + '⚠️  Performans Önerileri:' + colors.reset);
  
  const warnings = [];
  
  const largeFiles = [...getFilesInDir(distDir, ['.js', '.css'])].filter(f => f.size > 100000);
  if (largeFiles.length) {
    warnings.push(`  ${colors.yellow}•${colors.reset} ${largeFiles.length} dosya 100KB üzerinde - kod bölme düşünün`);
  }
  
  if (grandTotal.gzip > 500000) {
    warnings.push(`  ${colors.yellow}•${colors.reset} Toplam gzip boyutu 500KB üzerinde`);
  }
  
  if (warnings.length === 0) {
    console.log(`  ${colors.green}✓${colors.reset} Tüm dosyalar makul boyutta!`);
  } else {
    warnings.forEach(w => console.log(w));
  }
  
  console.log('\n');
}

analyze();

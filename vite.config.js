import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

/**
 * Plugin: .js importlarını .ts dosyalarına çözümle
 * (TypeScript moduleResolution: "bundler" convention)
 */
function resolveJsToTsPlugin() {
  return {
    name: 'resolve-js-to-ts',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.endsWith('.js') || !importer) return null;
      // Sadece relative importlarda çalış
      if (!source.startsWith('.')) return null;
      const dir = resolve(importer, '..');
      const jsPath = resolve(dir, source);
      // .js yoksa .ts'yi dene
      if (!existsSync(jsPath)) {
        const tsSource = source.replace(/\.js$/, '.ts');
        const resolved = await this.resolve(tsSource, importer, { ...options, skipSelf: true });
        return resolved;
      }
      return null;
    }
  };
}

/**
 * Plugin: manifest.json ve icon/ gibi statik dosyaları
 * Vite'ın hash'lemesinden koru
 */
function preserveStaticAssetsPlugin() {
  // Vite HTML'i işlemeden önce statik referansları geçici placeholder'larla değiştir
  // Vite işledikten sonra orijinal yolları geri koy
  const MARKER = '/__bygog_static__/';
  const staticPrefixes = ['manifest.json', 'icon/', 'data/'];

  return {
    name: 'bygog-preserve-static',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let result = html;
        for (const prefix of staticPrefixes) {
          // href="manifest.json" → href="/__bygog_static__/manifest.json"
          const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          result = result.replace(
            new RegExp(`((?:href|src)=")${escaped}`, 'g'),
            `$1${MARKER}${prefix}`
          );
        }
        return result;
      }
    },
    // Dev sunucusunda placeholder'ları orijinal dosyalara yönlendir
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith(MARKER)) {
          req.url = req.url.replace(MARKER, '/');
        }
        next();
      });
    }
  };
}

/**
 * Plugin: Build sonrası HTML'deki placeholder'ları temizle,
 * statik dosyaları kopyala ve SW'yi güncelle
 */
function postBuildPlugin() {
  const MARKER = '/__bygog_static__/';

  return {
    name: 'bygog-post-build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Placeholder'ları orijinal yollarla değiştir
        return html.replaceAll(MARKER, '');
      }
    },
    closeBundle() {
      const root = process.cwd();
      const dist = resolve(root, 'dist');

      // Statik dizinleri kopyala
      cpSync(resolve(root, 'icon'), resolve(dist, 'icon'), { recursive: true });
      cpSync(resolve(root, 'data'), resolve(dist, 'data'), { recursive: true });
      cpSync(resolve(root, 'manifest.json'), resolve(dist, 'manifest.json'));
      cpSync(resolve(root, 'links.json'), resolve(dist, 'links.json'));

      // Vite manifest'inden hashed URL'leri oku
      let viteManifest = {};
      try {
        viteManifest = JSON.parse(
          readFileSync(resolve(dist, '.vite/manifest.json'), 'utf8')
        );
      } catch {
        console.warn('Vite manifest not found, skipping SW update');
        return;
      }

      // Hashed asset yollarını topla
      const hashedAssets = {};
      for (const [src, entry] of Object.entries(viteManifest)) {
        if (entry.file) {
          hashedAssets[src] = entry.file;
        }
      }

      // Service Worker'ı oluştur
      const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
      const version = pkg.version || '0.0.0';
      const manifestHash = createHash('md5')
        .update(JSON.stringify(hashedAssets))
        .digest('hex')
        .slice(0, 8);
      const cacheVersion = `v${version}-${manifestHash}`;

      // Vite manifest'inden doğru dosya yollarını bul
      // Vite CSS'leri birleştirip tek dosya yapar, JS'leri de chunk'lar
      const cssFile = findAsset(hashedAssets, ['assets/styles.css', 'assets/fab.css']);
      const mainJsFile = findAsset(hashedAssets, ['src/renderLinks.js', 'index.html']);

      let sw = readFileSync(resolve(root, 'sw.js'), 'utf8');

      // Cache version güncelle
      sw = sw.replace(
        /const CACHE_VERSION = '.*?';/g,
        `const CACHE_VERSION = '${cacheVersion}';`
      );
      sw = sw.replace(
        /const CACHE_NAME = '.*?';/g,
        `const CACHE_NAME = 'bygog-lab-cache-${cacheVersion}';`
      );

      // urlsToCache'i hashed URL'lerle güncelle
      const urls = new Set([
        '.',
        'index.html',
        'manifest.json',
        'data/links-index.json',
        'icon/bygog-lab-icon.svg',
        'icon/bygog-lab-logo.svg'
      ]);

      // Vite'ın ürettiği tüm asset dosyalarını ekle
      for (const entry of Object.values(viteManifest)) {
        if (entry.file) urls.add(entry.file);
        if (entry.css) entry.css.forEach(c => urls.add(c));
      }

      sw = sw.replace(
        /const urlsToCache = \[[\s\S]*?\];/g,
        `const urlsToCache = [\n  ${[...urls].map(u => `'${u}'`).join(',\n  ')}\n];`
      );

      // SW'deki hashed dosya pattern'ini güncelle (isHashed regex)
      writeFileSync(resolve(dist, 'sw.js'), sw);
      console.log(`SW updated - Cache Version: ${cacheVersion}`);
    }
  };
}

function findAsset(manifest, keys) {
  for (const key of keys) {
    if (manifest[key]) return manifest[key];
  }
  return null;
}

export default defineConfig({
  root: '.',
  base: './',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  server: {
    port: 5173,
    open: false
  },
  preview: {
    port: 3000
  },
  plugins: [
    resolveJsToTsPlugin(),
    preserveStaticAssetsPlugin(),
    postBuildPlugin()
  ]
});

# Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.

Format [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/) standardına uygundur.
Versiyon numaraları [Semantic Versioning](https://semver.org/lang/tr/) takip eder.

## [0.2.0] - 2025-12-23

### Eklenenler
- 🧪 Vitest ile test altyapısı kuruldu
- 📦 Modüler dosya yapısı (`src/lib/`)
  - `logger.js` - Merkezi hata loglama sistemi
  - `favorites.js` - Favoriler yönetimi
  - `clipboard.js` - Pano işlemleri
  - `dom-utils.js` - DOM yardımcı fonksiyonları
  - `search-utils.js` - Arama yardımcıları
  - `url-utils.js` - URL işlemleri
  - `icons.js` - Kategori ikonları
  - `constants.js` - Sabitler
- 🔄 GitHub Actions CI/CD workflow'ları
  - Otomatik validation ve build
  - Haftalık link kontrolü
  - Lighthouse performans denetimi
- 📝 CHANGELOG.md oluşturuldu
- 🔧 TypeScript hazırlığı (tsconfig.json, JSDoc tip tanımları)
- ♿ Accessibility iyileştirmeleri (role="search", aria attribute'lar)

### Değişenler
- CSS dosyaları artık build sırasında minify ediliyor
- Build script'i assets klasöründen okuyup dist'e yazıyor

### Düzeltilenler
- Boş catch bloklarına loglama eklendi

## [0.1.0] - 2025-12-01

### Eklenenler
- İlk sürüm
- PWA desteği ve Service Worker
- Lazy loading kategoriler
- Favoriler sistemi
- Arama fonksiyonu (Web Worker ile)
- Komut kopyalama
- Tema desteği (koyu mod)

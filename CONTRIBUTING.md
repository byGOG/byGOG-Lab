# byGOG Lab'a Katkıda Bulunma Rehberi

Katkılarınız için teşekkürler! Bu rehber yeni link ekleme, hata bildirme ve kod katkısı süreçlerini açıklar.

---

## İçindekiler

- [Yeni Link Ekleme](#yeni-link-ekleme)
- [Veri Şeması](#veri-şeması)
- [Kod Katkısı](#kod-katkısı)
- [Commit Kuralları](#commit-kuralları)
- [Doğrulama](#doğrulama)

---

## Yeni Link Ekleme

Yeni bir araç veya kaynak eklemek için `links.json` dosyasını düzenleyin.

### Basit link (alt kategori yok)

```json
{
  "url": "https://example.com",
  "name": "Araç Adı",
  "recommended": false,
  "description": "Kısa ve açıklayıcı Türkçe açıklama.",
  "icon": "icon/arackadi.svg",
  "alt": "Araç Adı",
  "tags": ["etiket1", "etiket2", "windows"]
}
```

### Winget komutu olan link

```json
{
  "url": "https://example.com",
  "name": "Araç Adı",
  "recommended": true,
  "description": "Açıklama.",
  "icon": "icon/arackadi.svg",
  "alt": "Araç Adı",
  "tags": ["etiket"],
  "copyText": "winget install Publisher.App"
}
```

---

## Veri Şeması

### `links.json` yapısı

```
{
  "categories": [
    {
      "title": "Kategori Başlığı",         // Zorunlu
      "links": [...],                       // Doğrudan linkler (alt kategori yoksa)
      "subcategories": [                    // Veya alt kategoriler
        {
          "title": "Alt Kategori",
          "links": [...]
        }
      ]
    }
  ]
}
```

### Link alanları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `url` | string | ✅ | HTTPS bağlantısı |
| `name` | string | ✅ | Benzersiz araç adı |
| `description` | string | ✅ | Türkçe kısa açıklama |
| `icon` | string | ✅ | `icon/` dizinindeki SVG yolu |
| `alt` | string | ✅ | İkon için alternatif metin |
| `tags` | string[] | ✅ | Arama etiketleri (küçük harf) |
| `recommended` | boolean | ✅ | Öne çıkan araç mı? |
| `copyText` | string | ❌ | Kopyalanacak winget/PS komutu |
| `info` | string | ❌ | Detaylı bilgi metni |
| `github` | string | ❌ | GitHub repo URL'si |

### Kurallar

- `name` değerleri tüm `links.json` genelinde **benzersiz** olmalıdır
- `url` mutlaka **HTTPS** ile başlamalıdır
- `icon` dosyası `icon/` dizininde **mevcut** olmalıdır (yoksa `icon/fallback.svg` kullanın)
- `tags` küçük harf, Türkçe kabul edilir (ör. `"önyükleme"`, `"güvenlik"`)
- `description` 150 karakteri geçmemelidir

---

## Kod Katkısı

### Ortam kurulumu

```bash
git clone https://github.com/bygog/byGOG-Lab.git
cd byGOG-Lab
npm install
npm run serve   # localhost:3000
```

### Testler

```bash
npm test              # Birim testleri
npm run test:coverage # Coverage raporu
npm run test:e2e      # Playwright E2E testleri
npm run typecheck     # TypeScript tip kontrolü
```

### Doğrulama

```bash
npm run validate        # links.json yapı doğrulaması
npm run check:encoding  # UTF-8 encoding kontrolü
npm run lint            # ESLint
npm run format:check    # Prettier format kontrolü
```

---

## Commit Kuralları

Bu proje [Conventional Commits](https://www.conventionalcommits.org/) standardını kullanır:

```
<tür>(<kapsam>): <açıklama>
```

**Türler:**

| Tür | Kullanım |
|-----|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltmesi |
| `data` | links.json değişikliği (yeni link vb.) |
| `docs` | Dokümantasyon |
| `style` | CSS değişikliği |
| `refactor` | Yeniden yapılandırma |
| `test` | Test ekleme/güncelleme |
| `chore` | Araç, config değişikliği |

**Örnekler:**

```
feat(search): add tag-based filtering
fix(favorites): prevent duplicate entries on reload
data: add Rufus 4.5 and NTLite to links
style(nav): improve mobile category nav spacing
```

---

## Doğrulama

PR açmadan önce aşağıdaki adımları çalıştırın:

```bash
npm run validate && npm run check:encoding && npm run lint && npm test
```

Tüm adımlar başarıyla geçmelidir.

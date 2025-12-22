const fs = require('fs');

const file = 'links.json';
const j = JSON.parse(fs.readFileSync(file, 'utf8'));

// Helper to set if exists
const set = (path, val) => {
  let cur = j;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur?.[path[i]];
    if (!cur) return;
  }
  if (cur && Object.prototype.hasOwnProperty.call(cur, path[path.length - 1])) {
    cur[path[path.length - 1]] = val;
  }
};

// CAT 1
set(['categories', 0, 'title'], '⭐ Önerilenler');

// CAT 2: Windows & Office
set(['categories', 1, 'subcategories', 0, 'title'], 'Windows İndirme & Kurulum');
set(['categories', 1, 'subcategories', 1, 'title'], 'Özel Windows Dağıtımları');
set(['categories', 1, 'subcategories', 2, 'title'], 'Linux Dağıtımları');
set(['categories', 1, 'subcategories', 3, 'title'], 'Office & Aktivasyon Araçları');
set(['categories', 1, 'subcategories', 4, 'title'], 'Ofis Uygulamaları');

// CAT 3: Sistem Araçları & Bakım
set(['categories', 2, 'title'], 'Sistem Araçları & Bakım');
set(['categories', 2, 'subcategories', 0, 'title'], 'Sistem Araçları');
set(['categories', 2, 'subcategories', 1, 'title'], 'Sürücü & Donanım');
set(['categories', 2, 'subcategories', 3, 'title'], 'Dosya & Disk Yönetimi');

// CAT 4: Güvenlik & Gizlilik
set(['categories', 3, 'title'], 'Güvenlik & Gizlilik');
set(['categories', 3, 'subcategories', 0, 'title'], 'Antivirüs & Kötü Amaçlı Yazılım Temizleyiciler');
set(['categories', 3, 'subcategories', 1, 'title'], 'Gizlilik & Telemetri Araçları');
set(['categories', 3, 'subcategories', 2, 'title'], 'Ağ, VPN & Güvenlik Araçları');
set(['categories', 3, 'subcategories', 3, 'title'], 'Şifre & Gizlilik Araçları');

// CAT 5: Yazılım & Paket Yöneticileri
set(['categories', 4, 'title'], 'Yazılım & Paket Yöneticileri');
set(['categories', 4, 'subcategories', 0, 'title'], 'Yazılım Kurulum & Paket Yöneticileri');
set(['categories', 4, 'subcategories', 1, 'title'], 'Taşınabilir Uygulama Platformları');
set(['categories', 4, 'subcategories', 2, 'title'], 'Yazılım Alternatifleri & Karşılaştırma');
set(['categories', 4, 'subcategories', 3, 'title'], 'Yazılım Portalları & İncelemeler');

// CAT 6: İnternet & Tarayıcı
set(['categories', 5, 'title'], 'İnternet & Tarayıcı');
set(['categories', 5, 'subcategories', 0, 'title'], 'Web Tarayıcılar & Eklentiler');
set(['categories', 5, 'subcategories', 1, 'title'], 'Tarayıcı Eklentileri & Güvenlik');
set(['categories', 5, 'subcategories', 2, 'title'], 'Ağ Testleri & Hız Ölçümleri');

// CAT 7: Medya & İndirme
set(['categories', 6, 'title'], 'Medya & İndirme');
set(['categories', 6, 'subcategories', 0, 'title'], 'Yazılım İndirme & Arşivleri');
set(['categories', 6, 'subcategories', 2, 'title'], 'Torrent & DDL Platformları');
set(['categories', 6, 'subcategories', 3, 'title'], 'Medya & Eğlence Platformları');
set(['categories', 6, 'subcategories', 4, 'title'], 'Müzik & Video Akış Platformları');
set(['categories', 6, 'subcategories', 5, 'title'], 'Müzik Platformları');
set(['categories', 6, 'subcategories', 6, 'title'], 'Medya Dönüştürücüler & İndiriciler');
set(['categories', 6, 'subcategories', 7, 'title'], 'Dizi & Film İzleme Siteleri');

// CAT 8: Geliştirici & Tasarım
set(['categories', 7, 'title'], 'Geliştirici & Tasarım');
set(['categories', 7, 'subcategories', 0, 'title'], 'Yazılım Geliştirme Araçları');
set(['categories', 7, 'subcategories', 1, 'title'], 'Programlama Dilleri & Araçlar');
set(['categories', 7, 'subcategories', 2, 'title'], 'Grafik & Tasarım Araçları');

// CAT 9: Uygulamalar & Araçlar
set(['categories', 8, 'title'], 'Uygulamalar & Araçlar');
set(['categories', 8, 'subcategories', 0, 'title'], 'Masaüstü Özelleştirme & Arayüz Araçları');
set(['categories', 8, 'subcategories', 1, 'title'], 'Çeviri & Dil Araçları');
set(['categories', 8, 'subcategories', 2, 'title'], 'Yapay Zeka & Asistan Araçları');
set(['categories', 8, 'subcategories', 3, 'title'], 'Uzaktan Erişim & Destek Araçları');
set(['categories', 8, 'subcategories', 4, 'title'], 'Üretkenlik & Yardımcı Araçlar');

// CAT 10: Mobil & İletişim
set(['categories', 9, 'title'], 'Mobil & İletişim');
set(['categories', 9, 'subcategories', 1, 'title'], 'İletişim & E-posta Servisleri');
set(['categories', 9, 'subcategories', 2, 'title'], 'E-posta & Hesap Yönetimi');
set(['categories', 9, 'subcategories', 3, 'title'], 'Spor & Canlı Skor Platformları');

// CAT 11: Oyun (only one sub we fix)
set(['categories', 10, 'subcategories', 0, 'title'], 'Oyun & Topluluk Platformları');

fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n', 'utf8');
console.log('Titles fixed in', file);


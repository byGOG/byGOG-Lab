const fs = require('fs');
const assert = require('assert');

console.log('🔍 links.json dosyası test ediliyor...');

try {
  const raw = fs.readFileSync('links.json', 'utf8');
  const data = JSON.parse(raw);
  
  console.log(`✓ JSON dosyası başarıyla okundu (${raw.length} karakter)`);
  console.log(`✓ ${data.categories.length} kategori bulundu`);

  assert(Array.isArray(data.categories), 'categories must be an array');

  function validateLink(link, categoryName, subcategoryName = null) {
    try {
      assert(typeof link.url === 'string', 'link.url must be a string');
      assert(typeof link.name === 'string', 'link.name must be a string');
      assert(link.url.startsWith('http'), 'link.url must be a valid URL');
    } catch (error) {
      const location = subcategoryName ? `${categoryName} > ${subcategoryName}` : categoryName;
      throw new Error(`${location}: ${error.message}`);
    }
  }

  let totalLinks = 0;
  data.categories.forEach((cat, catIndex) => {
    try {
      assert(typeof cat.title === 'string', 'category.title must be a string');
      
      if (Array.isArray(cat.links)) {
        cat.links.forEach(link => validateLink(link, cat.title));
        totalLinks += cat.links.length;
      } else if (Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach(sc => {
          assert(typeof sc.title === 'string', 'subcategory.title must be a string');
          assert(Array.isArray(sc.links), 'subcategory.links must be an array');
          sc.links.forEach(link => validateLink(link, cat.title, sc.title));
          totalLinks += sc.links.length;
        });
      } else {
        throw new Error('category must have links or subcategories');
      }
    } catch (error) {
      throw new Error(`Kategori ${catIndex + 1} (${cat.title}): ${error.message}`);
    }
  });

  console.log(`✓ ${totalLinks} bağlantı başarıyla doğrulandı`);
  console.log('✅ links.json yapısı geçerli!');
  
} catch (error) {
  console.error('❌ Test başarısız:', error.message);
  process.exit(1);
}

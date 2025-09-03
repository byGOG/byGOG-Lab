const fs = require('fs');
const assert = require('assert');

const raw = fs.readFileSync('links.json', 'utf8');
const data = JSON.parse(raw);

assert(Array.isArray(data.categories), 'categories must be an array');

function validateLink(link) {
  assert(typeof link.url === 'string', 'link.url must be a string');
  assert(typeof link.name === 'string', 'link.name must be a string');
  assert(link.url.trim().length > 0, 'link.url must not be empty');
  assert(link.name.trim().length > 0, 'link.name must not be empty');
  // URL format check
  try {
    const u = new URL(link.url);
    assert(['http:', 'https:'].includes(u.protocol), 'url must be http/https');
  } catch {
    throw new Error(`invalid URL: ${link.url}`);
  }
  // Icon existence if local path
  if (typeof link.icon === 'string' && link.icon.startsWith('icon/')) {
    assert(fs.existsSync(link.icon), `icon not found: ${link.icon}`);
  }
}

data.categories.forEach(cat => {
  assert(typeof cat.title === 'string', 'category.title must be a string');
  if (Array.isArray(cat.links)) {
    cat.links.forEach(l => validateLink(l));
  } else if (Array.isArray(cat.subcategories)) {
    cat.subcategories.forEach(sc => {
      assert(typeof sc.title === 'string', 'subcategory.title must be a string');
      assert(Array.isArray(sc.links), 'subcategory.links must be an array');
      sc.links.forEach(l => validateLink(l));
    });
  } else {
    throw new Error('category must have links or subcategories');
  }
});

console.log('links.json structure OK');

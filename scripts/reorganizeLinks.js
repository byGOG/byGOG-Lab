const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'links.json');

function loadJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function saveJson(file, data) {
  const json = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(file, json, 'utf8');
}

function findCategory(data, title) {
  return data.categories.find((c) => c.title === title);
}

function ensureSubcategory(category, title) {
  if (!category.subcategories) category.subcategories = [];
  let sub = category.subcategories.find((s) => s.title === title);
  if (!sub) {
    sub = { title, links: [] };
    category.subcategories.push(sub);
  }
  if (!sub.links) sub.links = [];
  return sub;
}

function removeLinkByUrl(container, url) {
  if (!container || !container.links) return null;
  const idx = container.links.findIndex((l) => l.url === url);
  if (idx >= 0) {
    const [removed] = container.links.splice(idx, 1);
    return removed;
  }
  return null;
}

function takeLinkByNameFromAll(data, name) {
  for (const cat of data.categories) {
    if (cat.links) {
      const i = cat.links.findIndex((l) => l.name === name);
      if (i >= 0) return cat.links.splice(i, 1)[0];
    }
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        const i = sub.links.findIndex((l) => l.name === name);
        if (i >= 0) return sub.links.splice(i, 1)[0];
      }
    }
  }
  return null;
}

function linkExists(container, urlOrName) {
  return container.links.some((l) => l.url === urlOrName || l.name === urlOrName);
}

function main() {
  const data = loadJson(FILE);

  // 1) Move TechSpot out of "Windows İndirme & Kurulum" to a dedicated software portal subcategory
  const winCat = findCategory(data, 'Windows & Office');
  if (winCat && winCat.subcategories) {
    const winInstall = winCat.subcategories.find((s) => s.title === 'Windows İndirme & Kurulum');
    const techspot = removeLinkByUrl(winInstall, 'https://www.techspot.com/');

    if (techspot) {
      const softwareCat = findCategory(data, 'Yazılım & Paket Yöneticileri');
      if (softwareCat) {
        const portals = ensureSubcategory(softwareCat, 'Yazılım Portalları & İncelemeler');
        if (!linkExists(portals, techspot.url) && !linkExists(portals, techspot.name)) {
          portals.links.push(techspot);
        }
      } else {
        // Fallback: if category not found, return TechSpot back to its original place
        winInstall && techspot && winInstall.links.push(techspot);
      }
    }
  }

  // 2) Move CopyQ, ShareX, ImageGlass out of "Bulut Depolama & Yedekleme" into "Üretkenlik & Yardımcı Araçlar"
  const mediaCat = findCategory(data, 'Medya & İndirme');
  if (mediaCat && mediaCat.subcategories) {
    const cloud = mediaCat.subcategories.find((s) => s.title === 'Bulut Depolama & Yedekleme');
    const toMoveNames = ['CopyQ', 'ShareX', 'ImageGlass'];
    const moved = [];
    for (const name of toMoveNames) {
      // find and remove by name only within the cloud subcategory
      if (cloud) {
        const idx = cloud.links ? cloud.links.findIndex((l) => l.name === name) : -1;
        if (idx >= 0) moved.push(cloud.links.splice(idx, 1)[0]);
      }
    }

    if (moved.length) {
      const appsCat = findCategory(data, 'Uygulamalar & Araçlar');
      if (appsCat) {
        const utils = ensureSubcategory(appsCat, 'Üretkenlik & Yardımcı Araçlar');
        for (const link of moved) {
          if (!linkExists(utils, link.url) && !linkExists(utils, link.name)) {
            utils.links.push(link);
          }
        }
      } else {
        // Fallback: put them back if target not found
        if (cloud) cloud.links.push(...moved);
      }
    }
  }

  saveJson(FILE, data);
}

main();


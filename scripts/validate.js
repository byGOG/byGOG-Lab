/*
  Minimal validator for links.json without external deps.
  Usage: node scripts/validate.js
*/
const fs = require('fs');
const path = require('path');

const file = 'links.json';
const j = JSON.parse(fs.readFileSync(file, 'utf8'));

let errors = 0;
let warnings = 0;

const isStr = v => typeof v === 'string' && v.length >= 0;
// Detect likely mojibake or replacement characters in UTF-8 Turkish text
// - Replacement char U+FFFD (\\\\uFFFD|�|Ã.|Â|Ä.|Å.)
// - Common UTF-8 mis-decoding sequences: Ã, Â, \\\\uFFFD|�|Ã.|Â|Ä.|Å. (literal)
const hasMojibake = s => {
  const str = String(s);
  return /\uFFFD|Ã|Â|\\\\uFFFD|�|Ã.|Â|Ä.|Å./.test(str);
};
const isBool = v => typeof v === 'boolean';
const isArr = Array.isArray;

function validateLink(l, pathStr) {
  if (!isStr(l.url)) { console.error(`ERROR ${pathStr}.url must be string`); errors++; }
  if (!isStr(l.name)) { console.error(`ERROR ${pathStr}.name must be string`); errors++; }
  if (l.hasOwnProperty('recommended') && !isBool(l.recommended)) {
    console.error(`ERROR ${pathStr}.recommended must be boolean`); errors++;
  }
  if (l.hasOwnProperty('description') && !isStr(l.description)) {
    console.error(`ERROR ${pathStr}.description must be string`); errors++;
  }
  if (isStr(l.name) && hasMojibake(l.name)) { console.warn(`WARN  ${pathStr}.name contains invalid characters`); warnings++; }
  if (isStr(l.description) && hasMojibake(l.description)) { console.warn(`WARN  ${pathStr}.description contains invalid characters`); warnings++; }
  if (l.hasOwnProperty('icon') && !isStr(l.icon)) {
    console.error(`ERROR ${pathStr}.icon must be string`); errors++;
  }
  if (l.hasOwnProperty('alt') && !isStr(l.alt)) {
    console.error(`ERROR ${pathStr}.alt must be string`); errors++;
  }
  if (l.hasOwnProperty('tags') && !isArr(l.tags)) {
    console.error(`ERROR ${pathStr}.tags must be array`); errors++;
  }
  // Warn if icon file does not exist (skip http/https)
  if (isStr(l.icon) && !/^https?:\/\//i.test(l.icon)) {
    const iconPath = path.resolve(l.icon);
    if (!fs.existsSync(iconPath)) { console.warn(`WARN  ${pathStr}.icon not found: ${l.icon}`); warnings++; }
  }
}

function validate() {
  if (!j || !isArr(j.categories)) {
    console.error('ERROR root.categories must be an array');
    process.exit(1);
  }
  j.categories.forEach((cat, i) => {
    if (!isStr(cat.title)) { console.error(`ERROR categories[${i}].title must be string`); errors++; }
    else if (hasMojibake(cat.title)) { console.warn(`WARN  categories[${i}].title contains invalid characters`); warnings++; }
    if (cat.links && !isArr(cat.links)) { console.error(`ERROR categories[${i}].links must be array`); errors++; }
    if (cat.subcategories && !isArr(cat.subcategories)) { console.error(`ERROR categories[${i}].subcategories must be array`); errors++; }
    if (isArr(cat.links)) {
      cat.links.forEach((l, k) => validateLink(l, `categories[${i}].links[${k}]`));
    }
    if (isArr(cat.subcategories)) {
      cat.subcategories.forEach((sub, jdx) => {
        if (!isStr(sub.title)) { console.error(`ERROR categories[${i}].subcategories[${jdx}].title must be string`); errors++; }
        else if (hasMojibake(sub.title)) { console.warn(`WARN  categories[${i}].subcategories[${jdx}].title contains invalid characters`); warnings++; }
        if (!isArr(sub.links)) { console.error(`ERROR categories[${i}].subcategories[${jdx}].links must be array`); errors++; }
        else sub.links.forEach((l, k) => validateLink(l, `categories[${i}].subcategories[${jdx}].links[${k}]`));
      });
    }
  });
}

validate();

if (errors) {
  console.error(`\nValidation failed with ${errors} error(s).`);
  process.exit(1);
}

if (warnings) {
  console.warn(`\nValidation warnings: ${warnings}`);
}

console.log('links.json validation OK');

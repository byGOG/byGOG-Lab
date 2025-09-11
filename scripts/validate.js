/*
  Minimal validator for links.json without external deps.
  Usage: node scripts/validate.js
*/
const fs = require('fs');

const file = 'links.json';
const j = JSON.parse(fs.readFileSync(file, 'utf8'));

let errors = 0;
let warnings = 0;

const isStr = v => typeof v === 'string' && v.length >= 0;
const isBool = v => typeof v === 'boolean';
const isArr = Array.isArray;

function validateLink(l, path) {
  if (!isStr(l.url)) { console.error(`ERROR ${path}.url must be string`); errors++; }
  if (!isStr(l.name)) { console.error(`ERROR ${path}.name must be string`); errors++; }
  if (l.hasOwnProperty('recommended') && !isBool(l.recommended)) {
    console.error(`ERROR ${path}.recommended must be boolean`); errors++;
  }
  if (l.hasOwnProperty('description') && !isStr(l.description)) {
    console.error(`ERROR ${path}.description must be string`); errors++;
  }
  if (l.hasOwnProperty('icon') && !isStr(l.icon)) {
    console.error(`ERROR ${path}.icon must be string`); errors++;
  }
  if (l.hasOwnProperty('alt') && !isStr(l.alt)) {
    console.error(`ERROR ${path}.alt must be string`); errors++;
  }
  if (l.hasOwnProperty('tags') && !isArr(l.tags)) {
    console.error(`ERROR ${path}.tags must be array`); errors++;
  }
}

function validate() {
  if (!j || !isArr(j.categories)) {
    console.error('ERROR root.categories must be an array');
    process.exit(1);
  }
  j.categories.forEach((cat, i) => {
    if (!isStr(cat.title)) { console.error(`ERROR categories[${i}].title must be string`); errors++; }
    if (cat.links && !isArr(cat.links)) { console.error(`ERROR categories[${i}].links must be array`); errors++; }
    if (cat.subcategories && !isArr(cat.subcategories)) { console.error(`ERROR categories[${i}].subcategories must be array`); errors++; }
    if (isArr(cat.links)) {
      cat.links.forEach((l, k) => validateLink(l, `categories[${i}].links[${k}]`));
    }
    if (isArr(cat.subcategories)) {
      cat.subcategories.forEach((sub, jdx) => {
        if (!isStr(sub.title)) { console.error(`ERROR categories[${i}].subcategories[${jdx}].title must be string`); errors++; }
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


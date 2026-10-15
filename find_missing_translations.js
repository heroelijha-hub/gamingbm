const fs = require('fs');
const path = require('path');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const enKeys = getKeys(en);

const langs = ['de', 'fr', 'es'];
const missing = {};

for (const lang of langs) {
  missing[lang] = [];
  const file = `./messages/${lang}.json`;
  if (!fs.existsSync(file)) continue;
  
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const objKeys = getKeys(obj);
  
  for (const k of enKeys) {
    if (!objKeys.includes(k)) {
      missing[lang].push(k);
    }
  }
}

console.log(JSON.stringify(missing, null, 2));

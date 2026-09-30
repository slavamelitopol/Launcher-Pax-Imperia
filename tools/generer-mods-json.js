// Génère mods.json à partir d'un dossier contenant tes mods.
// Usage :
//   node tools/generer-mods-json.js <dossier-des-mods> <url-de-base>
// Exemple :
//   node tools/generer-mods-json.js ./mods https://github.com/TON-PSEUDO/TON-DEPOT/releases/download/mods/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [dir, baseUrl] = process.argv.slice(2);
if (!dir || !baseUrl) {
  console.error('Usage : node tools/generer-mods-json.js <dossier-des-mods> <url-de-base>');
  process.exit(1);
}

const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
const mods = fs.readdirSync(dir)
  .filter(f => f.endsWith('.jar'))
  .map(name => {
    if (/\s/.test(name)) console.warn(`Attention : "${name}" contient des espaces, renomme-le avant de l'envoyer sur GitHub.`);
    const sha1 = crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, name))).digest('hex');
    return { name, url: base + encodeURIComponent(name), sha1 };
  });

fs.writeFileSync('mods.json', JSON.stringify({ mods }, null, 2));
console.log(`mods.json créé avec ${mods.length} mod(s).`);

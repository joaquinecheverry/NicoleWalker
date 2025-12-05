// run: node generatePatternList.js

const fs = require('fs');
const path = require('path');

const folder = path.join(__dirname, 'pattern-images');

const files = fs.readdirSync(folder)
  .filter(f =>
    /\.(jpg|jpeg|png|webp|tif)$/i.test(f)
  )
  .map(f => `pattern-images/${f}`);

const output = `export const localPatternImages = ${JSON.stringify(files, null, 2)};`;

fs.writeFileSync(path.join(__dirname, 'pattern-images.js'), output);

console.log(`Generated pattern-images.js with ${files.length} files`);

// build-pattern-list.mjs
import fs from "fs";
import path from "path";

const fullDir   = path.join(process.cwd(), "pattern-images/full");
const thumbsDir = path.join(process.cwd(), "pattern-images/thumbs");

const fullFiles = fs.readdirSync(fullDir).filter(f =>
  /\.(jpe?g|png|webp|tif?f)$/i.test(f)
);

const entries = fullFiles.map(file => {
  const base = path.parse(file).name;      // e.g. "GOODLUCK1"
  const fullPath  = `pattern-images/full/${file}`;
  const thumbPath = `pattern-images/thumbs/${base}.webp`; // we just created these

  return { thumb: thumbPath, full: fullPath };
});

const js = `// AUTO-GENERATED. Do not edit by hand.
export const localPatternImages = ${JSON.stringify(entries, null, 2)};
`;

fs.writeFileSync("pattern-images.js", js, "utf8");
console.log(`Wrote pattern-images.js with ${entries.length} entries.`);

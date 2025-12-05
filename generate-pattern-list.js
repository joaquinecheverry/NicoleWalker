const fs = require("fs");
const path = require("path");

const thumbsDir = "./pattern-images/thumbs";
const fullDir   = "./pattern-images/full";

const thumbs = fs.readdirSync(thumbsDir)
  .filter(f => f.match(/\.(jpg|jpeg|png|webp|gif|tif|tiff)$/i));

const fulls = fs.readdirSync(fullDir)
  .filter(f => f.match(/\.(jpg|jpeg|png|webp|gif|tif|tiff)$/i));

const output = thumbs.map(name => {
  return `  { thumb: "pattern-images/thumbs/${name}", full: "pattern-images/full/${name}" },`;
});

console.log("export const localPatternImages = [");
console.log(output.join("\n"));
console.log("];");

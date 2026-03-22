const fs = require("fs");
const path = require("path");

const root = process.cwd();
const src = path.join(root, "src");
const dist = path.join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "logic.js",
  "manifest.webmanifest",
  "sw.js",
];
const dirs = ["icons"];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dist, file));
}

for (const dir of dirs) {
  fs.cpSync(path.join(src, dir), path.join(dist, dir), { recursive: true });
}

console.log("dist ready");

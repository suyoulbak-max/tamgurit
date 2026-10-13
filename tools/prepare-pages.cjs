"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const target = path.join(root, "_site");
const entries = [
  "index.html", "404.html", ".nojekyll", "CNAME", "ads.txt", "robots.txt", "sitemap.xml",
  "about", "admin", "assets", "author", "categories", "columns", "contact", "data",
  "disclaimer", "posts", "privacy", "sitemap", "terms",
  ...fs.readdirSync(root).filter((name) => /^naver[a-f0-9]+\.html$/.test(name))
];
if (fs.existsSync(target)) throw new Error("_site already exists; use a fresh checkout or move the previous preview before packaging.");
for (const entry of entries) {
  if (!fs.existsSync(path.join(root, entry))) throw new Error(`Missing public entry: ${entry}`);
}
fs.mkdirSync(target);
for (const entry of entries) fs.cpSync(path.join(root, entry), path.join(target, entry), { recursive: true });
console.log(`Public package: _site (${entries.length} entries); internal notes and tools excluded.`);

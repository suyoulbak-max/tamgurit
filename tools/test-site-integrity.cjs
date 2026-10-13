"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, "..");
const directories = ["about", "admin", "author", "categories", "columns", "contact", "disclaimer", "posts", "privacy", "sitemap", "terms"];
const htmlFiles = ["index.html", "404.html", ...directories.flatMap((dir) => fs.readdirSync(path.join(root, dir)).filter((name) => name.endsWith(".html")).map((name) => `${dir}/${name}`))];
const failures = [];
let links = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const value = match[1].replace(/&amp;/g, "&");
    if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) continue;
    const pathname = decodeURIComponent(value.split(/[?#]/)[0]);
    if (!pathname) continue;
    const target = pathname.startsWith("/") ? path.join(root, pathname) : path.resolve(root, path.dirname(file), pathname);
    links++;
    if (!fs.existsSync(target)) failures.push(`${file}: missing ${value}`);
  }
}
const context = { window: { SiteData: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data/posts.js"), "utf8"), context);
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const post of context.window.SiteData.posts.filter((item) => item.ads === false)) {
  const html = fs.readFileSync(path.join(root, "posts", post.slug + ".html"), "utf8");
  assert(html.includes(post.content), `${post.slug}: source body must be fully prerendered`);
  assert(sitemap.includes(`/posts/${post.slug}.html</loc>`), `${post.slug}: missing sitemap entry`);
  assert(!/adsbygoogle\.js/.test(html), `${post.slug}: advertising loader present`);
}
assert.equal(failures.length, 0, failures.join("\n"));
console.log(`Site integrity PASS: ${htmlFiles.length} HTML files, ${links} local references, complete revised bodies and advertising exclusions.`);

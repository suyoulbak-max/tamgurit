#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const pages = fs.readdirSync(path.join(root, "posts"))
  .filter((name) => name.endsWith(".html") && !["index.html", "detail.html"].includes(name));

assert(pages.length > 0, "no generated post pages");
assert(
  app.includes('query("slug") || document.body.dataset.slug'),
  "post renderer must accept the clean page data-slug"
);
assert(
  app.includes('? "posts/" + encodeURIComponent(post.slug) + ".html"'),
  "clean post renderer must preserve the clean canonical URL"
);

for (const name of pages) {
  const html = fs.readFileSync(path.join(root, "posts", name), "utf8");
  const slug = name.replace(/\.html$/, "");
  assert(html.includes(`<body data-page="post-detail" data-slug="${slug}">`), `${name}: missing route data`);
  assert(html.includes('<div id="app">'), `${name}: missing app mount`);
  assert(html.includes('class="article-layout"'), `${name}: missing article layout fallback`);
  assert(html.includes('class="article-body"'), `${name}: missing article body fallback`);
  assert(html.includes('class="aside"'), `${name}: missing sidebar fallback`);
  assert(html.includes('../assets/js/app.js'), `${name}: missing shared renderer`);
  assert(html.includes('../assets/css/style.css'), `${name}: missing shared stylesheet`);
  assert(!html.includes('<style>'), `${name}: standalone CSS overrides shared design`);
  assert(html.includes(`<link rel="canonical" href="https://plus-literacy.co.kr/posts/${name}">`), `${name}: canonical changed`);
}

console.log(`Static post layout test passed: ${pages.length} pages`);

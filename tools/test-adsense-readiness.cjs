#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://plus-literacy.co.kr";
const ctx = { window: { SiteData: {} } };
vm.createContext(ctx);
for (const file of ["site.config.js", "categories.js", "posts.js", "columns.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "data", file), "utf8"), ctx, { filename: file });
}
const { categories, posts, columns } = ctx.window.SiteData;
const publishedPosts = posts.filter((item) => item.status === "published");
const publishedColumns = columns.filter((item) => item.status === "published");
const errors = [];

function read(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    errors.push(`${rel}: missing`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#\d+);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expectPage(rel, { minChars = 300, h1 = true, canonical, ads = true } = {}) {
  const html = read(rel);
  if (h1 && !/<h1\b/i.test(html)) errors.push(`${rel}: missing static h1`);
  const chars = visibleText(html).length;
  if (chars < minChars) errors.push(`${rel}: thin server HTML (${chars} visible chars, need ${minChars})`);
  const hasAds = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/.test(html);
  if (ads && !hasAds) errors.push(`${rel}: missing AdSense loader`);
  if (!ads && hasAds) errors.push(`${rel}: utility/trust page must not load AdSense`);
  if (canonical && !html.includes(`<link rel="canonical" href="${canonical}">`)) errors.push(`${rel}: wrong or missing canonical ${canonical}`);
  return html;
}

const home = expectPage("index.html", { minChars: 1000, canonical: `${SITE}/` });
if (!home.includes('name="naver-site-verification"')) errors.push("index.html: missing Naver verification meta");
if ((home.match(/posts\/[a-z0-9-]+\.html/g) || []).length < 6) errors.push("index.html: needs at least 6 clean post links");

const postIndex = expectPage("posts/index.html", { minChars: 1800, canonical: `${SITE}/posts/` });
for (const post of publishedPosts) {
  if (!postIndex.includes(`${post.slug}.html`)) errors.push(`posts/index.html: missing ${post.slug}`);
  expectPage(`posts/${post.slug}.html`, { minChars: 700, canonical: `${SITE}/posts/${post.slug}.html` });
}

const categoryIndex = expectPage("categories/index.html", { minChars: 600, canonical: `${SITE}/categories/` });
const indexableCategories = categories.filter((category) => publishedPosts.some((post) => {
  const slugs = Array.isArray(post.categorySlugs) ? post.categorySlugs : [post.categorySlug];
  return slugs.includes(category.slug);
}));
for (const category of indexableCategories) {
  if (!categoryIndex.includes(`${category.slug}.html`)) errors.push(`categories/index.html: missing clean link ${category.slug}`);
  const html = expectPage(`categories/${category.slug}.html`, { minChars: 250, canonical: `${SITE}/categories/${category.slug}.html` });
  const expected = publishedPosts.filter((post) => {
    const slugs = Array.isArray(post.categorySlugs) ? post.categorySlugs : [post.categorySlug];
    return slugs.includes(category.slug);
  });
  for (const post of expected) if (!html.includes(`../posts/${post.slug}.html`)) errors.push(`categories/${category.slug}.html: missing ${post.slug}`);
}
for (const category of categories.filter((item) => !indexableCategories.includes(item))) {
  if (categoryIndex.includes(`${category.slug}.html`)) errors.push(`categories/index.html: empty category must be hidden ${category.slug}`);
  if (fs.existsSync(path.join(ROOT, "categories", `${category.slug}.html`))) errors.push(`categories/${category.slug}.html: stale empty category page must be removed`);
}

const columnIndex = expectPage("columns/index.html", { minChars: 600, canonical: `${SITE}/columns/` });
for (const column of publishedColumns) {
  if (!columnIndex.includes(`${column.slug}.html`)) errors.push(`columns/index.html: missing ${column.slug}`);
  expectPage(`columns/${column.slug}.html`, { minChars: 500, canonical: `${SITE}/columns/${column.slug}.html` });
}

for (const rel of ["about/index.html", "author/index.html", "contact/index.html", "privacy/index.html", "terms/index.html", "disclaimer/index.html", "sitemap/index.html"]) {
  expectPage(rel, { minChars: rel.startsWith("contact/") ? 250 : 500, canonical: `${SITE}/${rel.replace(/index\.html$/, "")}`, ads: false });
}

const sitemap = read("sitemap.xml");
if (/detail\.html\?slug=/.test(sitemap)) errors.push("sitemap.xml: query-string content URLs remain");
for (const column of publishedColumns) if (!sitemap.includes(`${SITE}/columns/${column.slug}.html`)) errors.push(`sitemap.xml: missing clean column ${column.slug}`);
for (const post of publishedPosts) if (!sitemap.includes(`<loc>${SITE}/posts/${post.slug}.html</loc>\n    <lastmod>${post.updatedAt || post.publishedAt}</lastmod>`)) errors.push(`sitemap.xml: missing post lastmod ${post.slug}`);
for (const category of categories.filter((item) => !indexableCategories.includes(item))) if (sitemap.includes(`/categories/${category.slug}.html`)) errors.push(`sitemap.xml: empty category must be excluded ${category.slug}`);

const ads = read("ads.txt").trim();
if (ads !== "google.com, pub-8108040193754389, DIRECT, f08c47fec0942fa0") errors.push("ads.txt: missing or incorrect Google publisher declaration");

for (const rel of ["posts/detail.html", "columns/detail.html", "admin/index.html", "404.html"]) {
  const html = read(rel);
  if (!/<meta name="robots" content="noindex,\s*nofollow">/i.test(html)) errors.push(`${rel}: thin/utility page must be noindex,nofollow`);
  if (/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/.test(html)) errors.push(`${rel}: thin/utility page must not load AdSense`);
}
for (const rel of ["posts/detail.html", "columns/detail.html"]) {
  const html = read(rel);
  if (!/location\.replace\(s\.replace\(\/\[\^a-z0-9-\]\/g/.test(html)) errors.push(`${rel}: legacy query URL must safely redirect to clean HTML`);
}

const appSource = read("assets/js/app.js");
if (/detail\.html\?slug=/.test(appSource)) errors.push("assets/js/app.js: user-facing content links must use clean static URLs");
if (/categories\/index\.html\?slug=/.test(appSource)) errors.push("assets/js/app.js: category links must use clean static URLs");
if (!/query\("slug"\) \|\| document\.body\.dataset\.slug/.test(appSource)) errors.push("assets/js/app.js: clean category/column pages need data-slug fallback");
if (!/isPrerendered[\s\S]*needsClientRender/.test(appSource)) errors.push("assets/js/app.js: must preserve prerendered core content");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`AdSense readiness passed: ${publishedPosts.length} posts, ${publishedColumns.length} columns, ${indexableCategories.length} indexed categories.`);

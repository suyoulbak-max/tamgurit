#!/usr/bin/env node
// Build static per-post HTML for SEO (unique title/meta/h1/content per clean URL).
// Run: node tools/build-static.cjs
"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://plus-literacy.co.kr";
const SITE_SUFFIX = "고교학점제 탐구보고서 가이드";
const ADSENSE = "ca-pub-8108040193754389";

// Load data/*.js into one shared window.SiteData context.
const ctx = { window: { SiteData: {} } };
vm.createContext(ctx);
for (const f of ["site.config.js", "categories.js", "posts.js", "columns.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "data", f), "utf8"), ctx);
}
const { config, categories, posts, columns } = ctx.window.SiteData;

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const jsonld = (obj) =>
  JSON.stringify(obj).replace(/</g, "\\u003c");

const catBySlug = new Map(categories.map((c) => [c.slug, c]));
const postBySlug = new Map(posts.map((p) => [p.slug, p]));

function catsOf(post) {
  const slugs = (post.categorySlugs && post.categorySlugs.length
    ? post.categorySlugs
    : [post.categorySlug]).filter(Boolean);
  return slugs.map((s) => catBySlug.get(s)).filter(Boolean);
}

function articleJsonLd(post, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || post.subtitle || "",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Organization", name: post.authorName || config.ownerName },
    publisher: { "@type": "Organization", name: config.name },
    mainEntityOfPage: url,
    url: url,
  };
}

function breadcrumbJsonLd(post, url) {
  const items = [
    { "@type": "ListItem", position: 1, name: "고교학점제 탐구보고서", item: SITE_URL + "/" },
  ];
  catsOf(post).forEach((c, i) =>
    items.push({
      "@type": "ListItem",
      position: i + 2,
      name: c.name,
      item: SITE_URL + "/categories/index.html?slug=" + encodeURIComponent(c.slug),
    })
  );
  items.push({ "@type": "ListItem", position: items.length + 1, name: post.title, item: url });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

function listBlock(title, items) {
  if (!Array.isArray(items) || !items.length) return "";
  return (
    "<h2>" + esc(title) + "</h2><ul>" +
    items.map((i) => "<li>" + esc(i) + "</li>").join("") +
    "</ul>"
  );
}

function renderPage(post) {
  const url = SITE_URL + "/posts/" + post.slug + ".html";
  const author = post.authorName || config.ownerName;
  const subtitle = post.subtitle || post.summary || "";
  const related = (post.relatedPostSlugs || [])
    .map((s) => postBySlug.get(s))
    .filter(Boolean);

  const headerHtml =
    '<a class="skip-link" href="#main-content">본문 바로가기</a>' +
    '<header class="site-header"><div class="container header-inner">' +
    '<a class="brand" href="../index.html"><strong>' + esc(config.name) + "</strong></a>" +
    '<nav class="nav" aria-label="주요 메뉴">' +
    '<a href="../index.html">홈</a>' +
    '<a href="../categories/index.html?slug=grade-guide">학년별</a>' +
    '<a href="../categories/index.html?slug=subject-guide">과목별</a>' +
    '<a href="../categories/index.html?slug=track-guide">진로·계열별</a>' +
    '<a href="../categories/index.html?slug=topic-examples">주제 예시</a>' +
    '<a href="../categories/index.html?slug=student-record">세특 연결</a>' +
    '<a href="../categories/index.html?slug=interview">면접 대비</a>' +
    '<a href="../columns/index.html">칼럼</a>' +
    '<a href="../about/index.html">소개</a>' +
    "</nav></div></header>";

  const footerHtml =
    '<section class="footer-cta"><div class="container footer-cta-inner">' +
    '<div class="footer-cta-icon" aria-hidden="true">&#9993;</div>' +
    "<h2>궁금한 점이 있으신가요?</h2>" +
    "<p>탐구보고서, 과목 선택, 세특 연결, 서류기반면접 준비에 대한 의견이나 문의를 보내주세요.</p>" +
    '<a class="button primary" href="../contact/index.html">문의하기 →</a>' +
    "</div></section>" +
    '<footer class="site-footer"><div class="container footer-grid">' +
    '<div class="footer-brand"><strong>' + esc(config.name) + "</strong><p>" + esc(config.description || "") + "</p></div>" +
    '<nav class="footer-column" aria-label="사이트 구조"><h2>사이트</h2>' +
    '<a href="../index.html">홈</a>' +
    '<a href="../categories/index.html?slug=grade-guide">학년별 탐구보고서</a>' +
    '<a href="../categories/index.html?slug=subject-guide">과목별 탐구보고서</a>' +
    '<a href="../categories/index.html?slug=track-guide">진로·계열별 탐구보고서</a>' +
    '<a href="../categories/index.html?slug=topic-examples">주제 예시</a>' +
    '<a href="../categories/index.html?slug=student-record">세특 연결</a>' +
    '<a href="../categories/index.html?slug=interview">면접 대비</a>' +
    '<a href="../columns/index.html">칼럼</a>' +
    '<a href="../about/index.html">소개</a>' +
    '<a href="../sitemap/index.html">사이트맵</a>' +
    "</nav>" +
    '<nav class="footer-column" aria-label="정보"><h2>정보</h2>' +
    '<a href="../author/index.html">운영자</a>' +
    '<a href="../contact/index.html">문의하기</a>' +
    '<a href="../privacy/index.html">개인정보처리방침</a>' +
    '<a href="../terms/index.html">이용약관</a>' +
    '<a href="../disclaimer/index.html">면책고지</a>' +
    "</nav></div></footer>";

  const body = [];
  body.push("<h1>" + esc(post.title) + "</h1>");
  if (subtitle) body.push('<p class="subtitle">' + esc(subtitle) + "</p>");
  body.push(
    '<p class="meta">' + esc(author) + " · 발행 " + esc(post.publishedAt || "") +
    (post.updatedAt ? " · 수정 " + esc(post.updatedAt) : "") + "</p>"
  );
  body.push(post.content || ""); // authored HTML, trusted source
  if (Array.isArray(post.tableOfContents) && post.tableOfContents.length)
    body.push("<h2>목차</h2><ol>" + post.tableOfContents.map((i) => "<li>" + esc(i) + "</li>").join("") + "</ol>");
  body.push(listBlock("핵심 포인트", post.keyPoints));
  body.push(listBlock("탐구보고서 흐름", post.reportFlow));
  body.push(listBlock("세특 연결 포인트", post.studentRecordPoints));
  body.push(listBlock("서류기반면접 예상 질문", post.interviewQuestions));
  body.push(listBlock("꼬리질문 대비", post.followUpQuestions));
  body.push(listBlock("자주 하는 실수", post.commonMistakes || post.avoidExpressions));
  body.push(listBlock("체크리스트", post.checklist));
  if (Array.isArray(post.tags) && post.tags.length)
    body.push('<div class="tags">' + post.tags.map((t) => "<span>#" + esc(t) + "</span>").join("") + "</div>");
  if (related.length)
    body.push(
      "<h2>관련 글</h2><ul>" +
      related.map((r) => '<li><a href="' + esc(r.slug) + '.html">' + esc(r.title) + "</a></li>").join("") +
      "</ul>"
    );
  body.push(
    '<div class="notice"><strong>운영자 안내</strong><br>이 글은 일반 교육 정보이며 특정 대학 합격·학생부 평가·면접 결과를 보장하지 않습니다. 학교와 대학의 공식 안내를 함께 확인해 주세요.</div>'
  );

  return (
    '<!doctype html>\n<html lang="ko">\n<head>\n' +
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE + '" crossorigin="anonymous"></script>\n' +
    '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>" + esc(post.title) + " | " + esc(SITE_SUFFIX) + "</title>\n" +
    '<meta name="description" content="' + esc(post.summary || post.subtitle || config.description) + '">\n' +
    '<link rel="canonical" href="' + url + '">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + esc(post.title) + '">\n' +
    '<meta property="og:description" content="' + esc(post.summary || post.subtitle || "") + '">\n' +
    '<meta property="og:url" content="' + url + '">\n' +
    '<meta property="og:site_name" content="' + esc(config.name) + '">\n' +
    '<meta name="twitter:card" content="summary">\n' +
    '<meta name="robots" content="index, follow">\n' +
    '<link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">\n' +
    '<script type="application/ld+json">' + jsonld(articleJsonLd(post, url)) + "</script>\n" +
    '<script type="application/ld+json">' + jsonld(breadcrumbJsonLd(post, url)) + "</script>\n" +
    '<link rel="stylesheet" href="../assets/css/style.css?v=20260708-4">\n' +
    "<style>\n" +
    "body{font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;line-height:1.8;color:#1f2937;margin:0}\n" +
    "header.site{border-bottom:1px solid #e5e7eb;padding:14px 20px}\n" +
    "header.site a{text-decoration:none;font-weight:700;color:#1f3d7a;font-size:18px}\n" +
    "main{max-width:720px;margin:0 auto;padding:24px 20px 64px}\n" +
    "h1{font-size:1.7em;line-height:1.35;margin:0 0 8px;color:#111827}\n" +
    ".meta{color:#6b7280;font-size:.9em;margin:0 0 8px}\n" +
    ".subtitle{color:#374151;font-size:1.05em;margin:0 0 24px}\n" +
    "h2{font-size:1.25em;margin-top:2em;color:#111827}\n" +
    "ul,ol{padding-left:1.4em}li{margin:.3em 0}a{color:#1f3d7a}\n" +
    ".tags span{display:inline-block;background:#eaf0ff;color:#1f3d7a;border-radius:999px;padding:2px 10px;margin:0 6px 6px 0;font-size:.85em}\n" +
    ".notice{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;color:#4b5563;font-size:.9em;margin-top:2em}\n" +
    "</style>\n</head>\n<body>\n" +
    headerHtml +
    '<main id="main-content">' + body.join("\n") + "</main>\n" +
    footerHtml + "\n</body>\n</html>\n"
  );
}

function sitemapXml() {
  const urls = [
    SITE_URL + "/",
    SITE_URL + "/categories/",
    SITE_URL + "/posts/",
  ];
  posts.forEach((p) => urls.push(SITE_URL + "/posts/" + p.slug + ".html"));
  urls.push(SITE_URL + "/columns/");
  (columns || []).forEach((c) =>
    urls.push(SITE_URL + "/columns/detail.html?slug=" + encodeURIComponent(c.slug))
  );
  urls.push(
    SITE_URL + "/author/",
    SITE_URL + "/about/",
    SITE_URL + "/contact/",
    SITE_URL + "/privacy/",
    SITE_URL + "/terms/",
    SITE_URL + "/disclaimer/",
    SITE_URL + "/sitemap/"
  );
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => "  <url>\n    <loc>" + u + "</loc>\n  </url>").join("\n") +
    "\n</urlset>\n"
  );
}

// Write per-post pages.
let written = 0;
for (const post of posts) {
  if (post.status && post.status !== "published") continue;
  fs.writeFileSync(path.join(ROOT, "posts", post.slug + ".html"), renderPage(post));
  written++;
}

// Regenerate sitemap with clean post URLs.
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemapXml());

console.log("static pages: " + written);
console.log("sitemap urls: " + (sitemapXml().match(/<loc>/g) || []).length);
console.log("sample: " + posts[0].title + " -> /posts/" + posts[0].slug + ".html");

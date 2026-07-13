(function () {
  "use strict";

  var storageKey = "researchGuideData";
  var defaults = window.SiteData || {};
  var root = document.getElementById("app");
  var page = (document.body && document.body.dataset.page) || "home";
  var basePath = page === "home" || page === "not-found" ? "." : "..";

  if (!root) return;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function itemKey(item) {
    return item && (item.slug || item.id);
  }

  function mergeItems(defaultItems, storedItems) {
    var merged = [];
    var seen = {};

    (Array.isArray(defaultItems) ? defaultItems : []).forEach(function (item) {
      var key = itemKey(item);
      if (key != null) seen[key] = merged.length;
      merged.push(item);
    });

    (Array.isArray(storedItems) ? storedItems : []).forEach(function (item) {
      var key = itemKey(item);
      if (key != null && Object.prototype.hasOwnProperty.call(seen, key)) {
        merged[seen[key]] = item;
      } else {
        if (key != null) seen[key] = merged.length;
        merged.push(item);
      }
    });

    return merged;
  }

  function loadData() {
    var fallback = {
      config: defaults.config || {},
      categories: defaults.categories || [],
      posts: defaults.posts || [],
      columns: defaults.columns || []
    };

    try {
      var raw = window.localStorage && window.localStorage.getItem(storageKey);
      if (!raw) return fallback;
      var stored = JSON.parse(raw);
      return {
        config: stored.config || stored.siteSettings || fallback.config,
        categories: mergeItems(fallback.categories, stored.categories),
        posts: mergeItems(fallback.posts, stored.posts),
        columns: mergeItems(fallback.columns, stored.columns)
      };
    } catch (error) {
      return fallback;
    }
  }

  var site = loadData();
  site.config = site.config || {};
  site.categories = Array.isArray(site.categories) ? site.categories : [];
  site.posts = Array.isArray(site.posts) ? site.posts : [];
  site.columns = Array.isArray(site.columns) ? site.columns : [];

  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function url(path) {
    var normalized = path || "index.html";
    if (/^(https?:|mailto:|#)/.test(normalized)) return normalized;
    return basePath + "/" + normalized.replace(/^\.\//, "");
  }

  function publishedPosts() {
    return site.posts
      .filter(function (post) {
        return post.status === "published";
      })
      .sort(function (a, b) {
        return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
      });
  }

  function publishedColumns() {
    return site.columns
      .filter(function (column) {
        return column.status === "published";
      })
      .sort(function (a, b) {
        return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
      });
  }

  function categoryBySlug(slug) {
    return site.categories.find(function (category) {
      return category.slug === slug;
    });
  }

  function postCategorySlugs(post) {
    var slugs = [];
    if (post && post.categorySlug) slugs.push(post.categorySlug);
    if (post && Array.isArray(post.categorySlugs)) {
      post.categorySlugs.forEach(function (slug) {
        if (slugs.indexOf(slug) < 0) slugs.push(slug);
      });
    }
    return slugs;
  }

  function postInCategory(post, slug) {
    return postCategorySlugs(post).indexOf(slug) >= 0;
  }

  function postCategories(post) {
    return postCategorySlugs(post).map(categoryBySlug).filter(Boolean);
  }

  function postBySlug(slug) {
    return site.posts.find(function (post) {
      return post.slug === slug && post.status === "published";
    });
  }

  function columnBySlug(slug) {
    return site.columns.find(function (column) {
      return column.slug === slug && column.status === "published";
    });
  }

  function setMeta(title, description) {
    var siteName = site.config.name || "고교학점제 탐구가이드";
    document.title = title ? title + " | " + siteName : siteName;
    var meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute("content", description);
  }

  function absoluteUrl(path) {
    var rootUrl = String(site.config.url || "https://www.tamgurit.co.kr").replace(/\/+$/, "");
    var clean = String(path || "").replace(/^\.\//, "").replace(/^\/+/, "");
    if (!clean || clean === "index.html") return rootUrl + "/";
    return rootUrl + "/" + clean;
  }

  function upsertMeta(selector, attr, value) {
    var element = document.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      if (selector.indexOf('property="') > -1) {
        element.setAttribute("property", selector.match(/property="([^"]+)"/)[1]);
      } else if (selector.indexOf('name="') > -1) {
        element.setAttribute("name", selector.match(/name="([^"]+)"/)[1]);
      }
      document.head.appendChild(element);
    }
    element.setAttribute(attr, value);
  }

  function setSeo(title, description, canonicalPath, type) {
    var siteName = site.config.name || "고교학점제 탐구가이드";
    var fullTitle = title ? title + " | " + siteName : siteName;
    var canonical = absoluteUrl(canonicalPath || "index.html");
    setMeta(title, description);
    var canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute("href", canonical);
    upsertMeta('meta[property="og:title"]', "content", fullTitle);
    upsertMeta('meta[property="og:description"]', "content", description || site.config.description || "");
    upsertMeta('meta[property="og:type"]', "content", type || "website");
    upsertMeta('meta[property="og:url"]', "content", canonical);
    upsertMeta('meta[name="twitter:card"]', "content", "summary");
    upsertMeta('meta[name="robots"]', "content", "index, follow");
  }

  function setJsonLd(id, data) {
    var script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  function navLink(label, path, route, slug) {
    var current = page === route && (!slug || query("slug") === slug) ? ' aria-current="page"' : "";
    return '<a href="' + url(path) + '"' + current + ">" + escapeHtml(label) + "</a>";
  }

  function header() {
    return '<a class="skip-link" href="#main-content">본문 바로가기</a>' +
      '<header class="site-header"><div class="container header-inner">' +
      '<a class="brand" href="' + url("index.html") + '">' +
      "<strong>" + escapeHtml(site.config.name || "고교학점제 탐구가이드") + "</strong>" +
      "</a>" +
      '<nav class="nav" aria-label="주요 메뉴">' +
      navLink("홈", "index.html", "home") +
      navLink("학년별", "categories/index.html?slug=grade-guide", "categories", "grade-guide") +
      navLink("과목별", "categories/index.html?slug=subject-guide", "categories", "subject-guide") +
      navLink("진로·계열별", "categories/index.html?slug=track-guide", "categories", "track-guide") +
      navLink("면접 대비", "categories/index.html?slug=interview", "categories", "interview") +
      navLink("칼럼", "columns/index.html", "columns") +
      navLink("소개", "about/index.html", "about") +
      "</nav></div></header>";
  }

  function footerLink(label, path) {
    return '<a href="' + url(path) + '">' + escapeHtml(label) + "</a>";
  }

  function footer() {
    var email = site.config.contactEmail || "tamgurit@gmail.com";
    return '<section class="footer-cta"><div class="container footer-cta-inner">' +
      '<div class="footer-cta-icon" aria-hidden="true">&#9993;</div>' +
      "<h2>궁금한 점이 있으신가요?</h2>" +
      "<p>탐구보고서, 과목 선택, 세특 연결, 서류기반면접 준비에 대한 의견이나 문의를 보내주세요.</p>" +
      '<a class="button primary" href="' + url("contact/index.html") + '">문의하기 →</a>' +
      "</div></section>" +
      '<footer class="site-footer"><div class="container footer-grid">' +
      '<div class="footer-brand"><strong>' + escapeHtml(site.config.name || "고교학점제 탐구가이드") + "</strong>" +
      "<p>" + escapeHtml(site.config.description || "고교학점제 탐구보고서 정보 허브") + "</p></div>" +
      '<nav class="footer-column" aria-label="사이트 구조"><h2>사이트</h2>' +
      footerLink("홈", "index.html") +
      footerLink("학년별 탐구보고서", "categories/index.html?slug=grade-guide") +
      footerLink("과목별 탐구보고서", "categories/index.html?slug=subject-guide") +
      footerLink("진로·계열별 탐구보고서", "categories/index.html?slug=track-guide") +
      footerLink("면접 대비", "categories/index.html?slug=interview") +
      footerLink("칼럼", "columns/index.html") +
      footerLink("소개", "about/index.html") +
      footerLink("사이트맵", "sitemap/index.html") +
      "</nav>" +
      '<nav class="footer-column" aria-label="정보"><h2>정보</h2>' +
      footerLink("운영자 " + (site.config.ownerName || "운영자"), "author/index.html") +
      footerLink("문의하기", "contact/index.html") +
      footerLink("개인정보처리방침", "privacy/index.html") +
      footerLink("이용약관", "terms/index.html") +
      footerLink("면책고지", "disclaimer/index.html") +
      "</nav></div>" +
      '<div class="container footer-bottom"><span>© 2026 ' + escapeHtml(site.config.name || "고교학점제 탐구가이드") + " · 운영자 " + escapeHtml(site.config.ownerName || "운영자") + "</span>" +
      '<a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + "</a></div></footer>";
  }

  function layout(content) {
    root.innerHTML = header() + '<main id="main-content" tabindex="-1">' + content + "</main>" + footer();
  }

  function metaRow(post) {
    var parts = [post.grade, post.subject, post.track].filter(Boolean);
    return '<div class="tag-row">' + parts.map(function (item, index) {
      return '<span class="tag' + (index === 2 ? " accent" : "") + '">' + escapeHtml(item) + "</span>";
    }).join("") + "</div>";
  }

  function postCard(post) {
    var categories = postCategories(post);
    var category = categories[0];
    return '<article class="card">' +
      metaRow(post) +
      '<h3><a href="' + url("posts/detail.html?slug=" + encodeURIComponent(post.slug)) + '">' + escapeHtml(post.title) + "</a></h3>" +
      "<p>" + escapeHtml(post.summary) + "</p>" +
      '<div class="card-footer"><span>' + escapeHtml(category ? category.name : "탐구 글") + "</span>" +
      '<a class="button" href="' + url("posts/detail.html?slug=" + encodeURIComponent(post.slug)) + '">읽기</a></div>' +
      "</article>";
  }

  function columnCard(column) {
    return '<article class="card">' +
      '<span class="tag accent">칼럼</span>' +
      '<h3><a href="' + url("columns/detail.html?slug=" + encodeURIComponent(column.slug)) + '">' + escapeHtml(column.title) + "</a></h3>" +
      "<p>" + escapeHtml(column.summary) + "</p>" +
      '<div class="card-footer"><span>' + escapeHtml(column.updatedAt || column.publishedAt || "") + "</span>" +
      '<a class="button" href="' + url("columns/detail.html?slug=" + encodeURIComponent(column.slug)) + '">읽기</a></div>' +
      "</article>";
  }

  function renderHome() {
    var posts = publishedPosts();
    var featured = posts.filter(function (post) { return post.featured; }).slice(0, 6);
    var latest = posts.slice(0, 6);
    var columns = publishedColumns().slice(0, 3);

    setMeta(null, site.config.description);
    layout(
      '<section class="hero"><div class="container hero-grid"><div>' +
      '<span class="eyebrow">고교학점제 탐구 설계</span>' +
      "<h1>탐구보고서에서<br>세특, 서류기반 면접까지<br>한 흐름으로 정리합니다.</h1>" +
      "<p>" + escapeHtml(site.config.description || "학년, 과목, 계열별로 탐구 주제를 좁히고 학생부와 면접 질문까지 연결하는 교육 정보 가이드입니다.") + "</p>" +
      '<div class="actions"><a class="button primary" href="' + url("posts/index.html") + '">탐구 글 보기</a><a class="button" href="' + url("categories/index.html") + '">분류별 보기</a></div>' +
      "</div><aside class=\"hero-panel\"><h2>핵심 흐름</h2><ol class=\"path-list\">" +
      "<li><b>1</b><span>학년별로 지금 필요한 탐구 깊이를 정합니다.</span></li>" +
      "<li><b>2</b><span>과목별, 계열별 질문으로 보고서 주제를 좁힙니다.</span></li>" +
      "<li><b>3</b><span>탐구보고서 내용을 세특과 면접 답변으로 연결합니다.</span></li>" +
      "</ol></aside></div></section>" +
      '<section class="feature-band section"><div class="container differentiator">' +
      '<div class="diff-item"><strong>학년별</strong><span>1학년 탐색, 2학년 과목 선택, 3학년 면접 정리까지 단계별로 봅니다.</span></div>' +
      '<div class="diff-item"><strong>과목별/계열별</strong><span>국어, 수학, 과학, 사회, 정보/AI 등 교과 언어로 질문을 만듭니다.</span></div>' +
      '<div class="diff-item"><strong>보고서 → 세특 → 면접</strong><span>기록이 끝나는 활동이 아니라 질문에 답할 수 있는 과정으로 정리합니다.</span></div>' +
      "</div></section>" +
      listSection("추천 글", "학생과 학부모가 먼저 보면 좋은 핵심 글입니다.", featured.map(postCard).join(""), "posts/index.html") +
      listSection("최신 글", "최근 업데이트된 탐구보고서와 면접 준비 글입니다.", latest.map(postCard).join(""), "posts/index.html") +
      listSection("탐구보고서 작성 칼럼", "탐구 기록을 더 차분하게 다듬는 관점입니다.", columns.map(columnCard).join(""), "columns/index.html")
    );
  }

  function listSection(title, description, cards, linkPath) {
    return '<section class="section"><div class="container">' +
      '<div class="section-header"><div><h2>' + escapeHtml(title) + "</h2><p class=\"lead\">" + escapeHtml(description) + "</p></div>" +
      '<a class="button" href="' + url(linkPath) + '">전체 보기</a></div>' +
      '<div class="grid">' + (cards || '<div class="empty">표시할 글이 없습니다.</div>') + "</div></div></section>";
  }

  function renderPosts() {
    var posts = publishedPosts();
    setMeta("탐구 글", "고교학점제 탐구보고서, 세특, 서류기반면접 준비 글 목록입니다.");
    layout('<section class="section"><div class="container"><h1>탐구 글</h1><p class="lead">학년, 과목, 계열, 면접 준비 흐름에 맞춰 탐구 글을 확인하세요.</p><div class="grid">' +
      posts.map(postCard).join("") + "</div></div></section>");
  }

  function renderCategories() {
    var slug = query("slug");
    if (slug) return renderCategoryDetail(slug);

    setMeta("분류", "고교학점제 탐구 글을 학년, 과목, 계열, 세특, 면접 기준으로 정리했습니다.");
    layout('<section class="section"><div class="container"><h1>분류별 탐구 가이드</h1><p class="lead">필요한 기준을 먼저 고르면 글을 더 빠르게 찾을 수 있습니다.</p><div class="grid">' +
      site.categories.map(function (category) {
        var count = publishedPosts().filter(function (post) { return postInCategory(post, category.slug); }).length;
        return '<article class="card"><span class="tag">' + escapeHtml(category.group) + "</span><h3>" +
          '<a href="' + url("categories/index.html?slug=" + encodeURIComponent(category.slug)) + '">' + escapeHtml(category.name) + "</a></h3>" +
          "<p>" + escapeHtml(category.description) + "</p>" +
          '<div class="card-footer"><span>' + count + '개 글</span><a class="button" href="' + url("categories/index.html?slug=" + encodeURIComponent(category.slug)) + '">보기</a></div></article>';
      }).join("") + "</div></div></section>");
  }

  function renderCategoryDetail(slug) {
    var category = categoryBySlug(slug);
    if (!category) return renderNotFound();
    var posts = publishedPosts().filter(function (post) {
      return postInCategory(post, slug);
    });

    setMeta(category.name, category.description);
    layout('<section class="section"><div class="container"><a class="button" href="' + url("categories/index.html") + '">분류 전체</a><h1>' +
      escapeHtml(category.name) + '</h1><p class="lead">' + escapeHtml(category.description) + '</p><div class="grid">' +
      (posts.length ? posts.map(postCard).join("") : '<div class="empty">이 분류에 표시할 글이 없습니다.</div>') +
      "</div></div></section>");
  }

  function renderPostDetail() {
    var post = postBySlug(query("slug"));
    if (!post) return renderNotFound();
    var related = (post.relatedPostSlugs || []).map(postBySlug).filter(Boolean);
    var canonicalPath = "posts/detail.html?slug=" + encodeURIComponent(post.slug);
    var faq = postFaq(post);
    var summaryItems = Array.isArray(post.summaryPoints) && post.summaryPoints.length ? post.summaryPoints : (post.keyPoints || []).slice(0, 3);
    var mistakes = Array.isArray(post.commonMistakes) && post.commonMistakes.length ? post.commonMistakes : post.avoidExpressions;
    var checklist = Array.isArray(post.checklist) && post.checklist.length ? post.checklist : post.reportFlow;

    setSeo(post.title, post.summary, canonicalPath, "article");
    setJsonLd("article-jsonld", articleJsonLd(post, "post", canonicalPath));
    setJsonLd("faq-jsonld", faqJsonLd(faq));
    layout('<article class="article-layout"><div class="article-body">' +
      '<header class="article-header">' +
      metaRow(post) +
      "<h1>" + escapeHtml(post.title) + "</h1>" +
      '<p class="article-subtitle">' + escapeHtml(post.subtitle || post.summary) + "</p>" +
      '<div class="meta byline"><span>' + escapeHtml(post.authorName || site.config.ownerName || "") + "</span><span>발행 " + escapeHtml(post.publishedAt || "") + "</span><span>수정 " + escapeHtml(post.updatedAt || "") + "</span></div>" +
      "</header>" +
      '<div class="article-top-grid">' +
      renderArticleToc(post.tableOfContents) +
      renderSummaryBox(summaryItems) +
      "</div>" +
      safeContent(post.content) +
      renderBriefing(postBriefing(post)) +
      renderComparison(postComparisons(post)) +
      renderBodyQuestions(postBodyQuestions(post)) +
      renderWritingSteps(postWritingSteps(post)) +
      renderListBlock("탐구보고서 흐름", post.reportFlow) +
      renderListBlock("세특 연결 포인트", post.studentRecordPoints) +
      renderQuestionBlock("서류기반면접 예상 질문", post.interviewQuestions) +
      renderQuestionBlock("꼬리질문 대비", post.followUpQuestions) +
      "<h2>초보자가 자주 하는 실수</h2>" + warningList(mistakes) +
      "<h2>체크리스트</h2>" + checkList(checklist) +
      renderTags(postTags(post)) +
      renderFaq(faq) +
      '<div class="notice-box"><strong>운영자 안내</strong><p>이 글은 일반 교육 정보입니다. 특정 대학 합격, 학생부 평가, 면접 결과를 보장하지 않습니다. 학교와 대학의 공식 안내를 함께 확인해 주세요.</p></div>' +
      renderAuthorBox(post.authorName) +
      (related.length ? '<h2>관련 글</h2><div class="grid two">' + related.map(postCard).join("") + "</div>" : "") +
      '</div><aside class="aside">' +
      '<div class="panel"><h3>핵심 포인트</h3>' + list(post.keyPoints) + "</div>" +
      '<div class="panel"><h3>목차</h3>' + orderedList(post.tableOfContents) + "</div>" +
      '<div class="panel"><h3>글 정보</h3><p><a href="' + url("author/index.html") + '">' + escapeHtml(site.config.ownerName || post.authorName || "운영자") + "</a></p><p>" + escapeHtml(site.config.ownerBio || "") + "</p></div>" +
      '<div class="panel"><h3>분류</h3><p>' + postCategories(post).map(function (category) { return '<a href="' + url("categories/index.html?slug=" + encodeURIComponent(category.slug)) + '">' + escapeHtml(category.name) + '</a>'; }).join("<br>") + "</p></div>" +
      "</aside></article>");
  }

  function safeContent(html) {
    return sanitizeContent(html);
  }

  function sanitizeContent(html) {
    var template = document.createElement("template");
    template.innerHTML = String(html || "");
    return sanitizeChildren(template.content);
  }

  function sanitizeChildren(parent) {
    return Array.prototype.map.call(parent.childNodes, sanitizeNode).join("");
  }

  function sanitizeNode(node) {
    var allowedTags = ["p", "strong", "em", "b", "i", "ul", "ol", "li", "br", "a"];
    var blockedContentTags = ["script", "style", "iframe", "object", "embed"];

    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    var tag = node.tagName.toLowerCase();
    if (blockedContentTags.indexOf(tag) >= 0) return "";
    if (allowedTags.indexOf(tag) < 0) return sanitizeChildren(node);
    if (tag === "br") return "<br>";

    var attrs = "";
    if (tag === "a") {
      var href = safeHref(node.getAttribute("href"));
      if (href) attrs = ' href="' + escapeHtml(href) + '"';
    }

    return "<" + tag + attrs + ">" + sanitizeChildren(node) + "</" + tag + ">";
  }

  function safeHref(href) {
    var value = String(href || "").trim();
    var lower = value.toLowerCase();

    if (!value) return "";
    if (lower.indexOf("http:") === 0 || lower.indexOf("https:") === 0 || lower.indexOf("mailto:") === 0) return value;
    if (value.charAt(0) === "." || value.charAt(0) === "#") return value;
    if (value.charAt(0) === "/" && value.charAt(1) !== "/") return value;
    return "";
  }

  function list(items) {
    if (!Array.isArray(items) || !items.length) return '<p class="empty">내용이 없습니다.</p>';
    return '<ul class="list">' + items.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</ul>";
  }

  function orderedList(items) {
    if (!Array.isArray(items) || !items.length) return '<p class="empty">내용이 없습니다.</p>';
    return '<ol class="number-list">' + items.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</ol>";
  }

  function checkList(items) {
    if (!Array.isArray(items) || !items.length) return '<p class="empty">내용이 없습니다.</p>';
    return '<ul class="check-list">' + items.map(function (item) {
      return '<li><span aria-hidden="true">✓</span>' + escapeHtml(item) + "</li>";
    }).join("") + "</ul>";
  }

  function warningList(items) {
    if (!Array.isArray(items) || !items.length) return '<p class="empty">내용이 없습니다.</p>';
    return '<ul class="warning-list">' + items.map(function (item) {
      return '<li><span aria-hidden="true">!</span>' + escapeHtml(item) + "</li>";
    }).join("") + "</ul>";
  }

  function renderArticleToc(items) {
    return '<section class="article-brief toc-box"><h2>목차</h2>' + orderedList(items) + "</section>";
  }

  function renderSummaryBox(items) {
    return '<section class="article-brief summary-box"><h2>핵심 요약</h2>' + checkList(items) + "</section>";
  }

  function renderTags(tags) {
    if (!Array.isArray(tags) || !tags.length) return "";
    return '<div class="article-tags">' + tags.map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag) + "</span>";
    }).join("") + "</div>";
  }

  function postTags(post) {
    return Array.isArray(post.tags) && post.tags.length ? post.tags : [post.grade, post.subject, post.track].filter(Boolean);
  }

  function postFaq(post) {
    if (Array.isArray(post.faq) && post.faq.length) return post.faq;
    var questions = (post.interviewQuestions || []).slice(0, 2).concat((post.followUpQuestions || []).slice(0, 1));
    return questions.map(function (question) {
      return {
        question: question,
        answer: "보고서의 교과 개념, 자료 선택 이유, 한계와 보완 방향을 연결해 본인의 말로 설명하는 것이 좋습니다."
      };
    });
  }

  function postBriefing(post) {
    return Array.isArray(post.briefingPoints) && post.briefingPoints.length ? post.briefingPoints : (post.keyPoints || []).slice(0, 3);
  }

  function postComparisons(post) {
    if (Array.isArray(post.comparisons) && post.comparisons.length) return post.comparisons;
    var labels = ["주제와 표현", "탐구 과정", "결론과 면접"];
    var common = post.avoidExpressions || [];
    var recommended = post.keyPoints || [];
    return labels.map(function (label, index) {
      return {
        label: label,
        common: common[index] || "근거 없이 넓고 단정적으로 작성",
        recommended: recommended[index] || "교과 개념과 근거를 바탕으로 구체적으로 작성"
      };
    });
  }

  function postBodyQuestions(post) {
    if (Array.isArray(post.bodyQuestions) && post.bodyQuestions.length) return post.bodyQuestions;
    return postFaq(post).slice(0, 3);
  }

  function postWritingSteps(post) {
    if (Array.isArray(post.writingSteps) && post.writingSteps.length) return post.writingSteps;
    return (post.reportFlow || []).slice(0, 5).map(function (step) {
      return {
        title: step,
        description: "이 단계에서 선택한 이유, 사용한 근거, 확인한 한계를 구체적으로 기록합니다."
      };
    });
  }

  function renderFaq(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<section class="faq-list"><h2>자주 묻는 질문</h2>' + items.map(function (item) {
      return '<details><summary>' + escapeHtml(item.question) + '</summary><p>' + escapeHtml(item.answer) + "</p></details>";
    }).join("") + "</section>";
  }

  function renderBriefing(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<section class="briefing-box"><h2>브리핑 포인트</h2>' + list(items) + "</section>";
  }

  function renderComparison(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<section class="comparison-section"><h2>흔한 작성 방식과 권장 기준</h2><div class="comparison-table" role="table">' +
      '<div class="comparison-row comparison-head" role="row"><strong role="columnheader">비교 항목</strong><strong role="columnheader">흔한 방식</strong><strong role="columnheader">권장 기준</strong></div>' +
      items.map(function (item) {
        return '<div class="comparison-row" role="row"><strong role="cell">' + escapeHtml(item.label) + '</strong><span role="cell">' +
          escapeHtml(item.common) + '</span><span role="cell">' + escapeHtml(item.recommended) + "</span></div>";
      }).join("") + "</div></section>";
  }

  function renderBodyQuestions(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<section class="body-questions"><h2>질문으로 점검하기</h2>' + items.map(function (item) {
      return '<article><h3>Q. ' + escapeHtml(item.question) + '</h3><p>' + escapeHtml(item.answer) + "</p></article>";
    }).join("") + "</section>";
  }

  function renderWritingSteps(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<section class="writing-steps"><h2>단계별 작성 공식</h2><ol>' + items.map(function (item) {
      return '<li><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.description) + "</p></li>";
    }).join("") + "</ol></section>";
  }

  function renderAuthorBox(authorName) {
    return '<section class="author-box"><h2>글 작성자</h2><strong>' + escapeHtml(authorName || site.config.ownerName || "탐구가이드 편집팀") + "</strong><p>" +
      escapeHtml(site.config.ownerBio || "고교학점제 탐구보고서, 세특, 서류기반면접 준비 흐름을 정리합니다.") +
      "</p></section>";
  }

  function articleJsonLd(item, kind, canonicalPath) {
    var canonical = absoluteUrl(canonicalPath);
    return {
      "@context": "https://schema.org",
      "@type": kind === "column" ? "BlogPosting" : "Article",
      "headline": item.title,
      "description": item.summary,
      "datePublished": item.publishedAt,
      "dateModified": item.updatedAt || item.publishedAt,
      "author": {
        "@type": "Person",
        "name": item.authorName || site.config.ownerName || "탐구가이드 편집팀",
        "url": absoluteUrl("author/")
      },
      "publisher": {
        "@type": "Organization",
        "name": site.config.name || "고교학점제 탐구가이드",
        "url": absoluteUrl("")
      },
      "mainEntityOfPage": canonical,
      "url": canonical,
      "articleSection": kind === "column" ? "칼럼" : ((categoryBySlug(item.categorySlug) || {}).name || "탐구 글"),
      "keywords": (kind === "column" ? item.tags : postTags(item)).join(", ")
    };
  }

  function faqJsonLd(items) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": items.map(function (item) {
        return {
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        };
      })
    };
  }

  function renderListBlock(title, items) {
    return "<h2>" + escapeHtml(title) + "</h2>" + list(items);
  }

  function renderQuestionBlock(title, items) {
    return "<h2>" + escapeHtml(title) + '</h2><div class="question-box">' + list(items) + "</div>";
  }

  function renderColumns() {
    var columns = publishedColumns();
    setMeta("칼럼", "탐구보고서를 세특과 면접까지 연결하는 운영 칼럼입니다.");
    layout('<section class="section"><div class="container"><h1>탐구보고서 작성 칼럼</h1><p class="lead">탐구 기록을 더 설득력 있게 정리하는 관점을 모았습니다.</p><div class="grid">' +
      columns.map(columnCard).join("") + "</div></div></section>");
  }

  function renderColumnDetail() {
    var column = columnBySlug(query("slug"));
    if (!column) return renderNotFound();
    var related = (column.relatedPostSlugs || []).map(postBySlug).filter(Boolean);
    var canonicalPath = "columns/detail.html?slug=" + encodeURIComponent(column.slug);

    setSeo(column.title, column.summary, canonicalPath, "article");
    setJsonLd("article-jsonld", articleJsonLd(column, "column", canonicalPath));
    layout('<article class="article-layout"><div class="article-body">' +
      '<header class="article-header column-header"><span class="tag accent">칼럼</span><h1>' + escapeHtml(column.title) + "</h1>" +
      '<p class="article-subtitle">' + escapeHtml(column.subtitle || column.summary) + "</p>" +
      '<div class="meta byline"><span>' + escapeHtml(column.authorName || site.config.ownerName || "") + "</span><span>발행 " + escapeHtml(column.publishedAt || "") + "</span><span>수정 " + escapeHtml(column.updatedAt || "") + "</span></div></header>" +
      safeContent(column.content) +
      renderTags(column.tags) +
      '<div class="notice-box"><strong>칼럼 안내</strong><p>이 칼럼은 운영자의 관점과 교육 정보 정리를 담고 있습니다. 특정 대학 합격, 학생부 평가, 면접 결과를 보장하지 않습니다.</p></div>' +
      renderAuthorBox(column.authorName) +
      (related.length ? '<h2>함께 볼 글</h2><div class="grid two">' + related.map(postCard).join("") + "</div>" : "") +
      '<p class="back-link"><a href="' + url("columns/index.html") + '">← 칼럼 목록으로 돌아가기</a></p>' +
      '</div><aside class="aside"><div class="panel"><h3>태그</h3><div class="tag-row">' +
      (Array.isArray(column.tags) ? column.tags.map(function (tag) { return '<span class="tag">' + escapeHtml(tag) + "</span>"; }).join("") : "") +
      '</div></div><div class="panel"><h3>안내</h3><p>칼럼은 일반적인 교육 정보와 관점 제공을 목적으로 합니다.</p></div></aside></article>');
  }

  function renderTrustPage(kind) {
    var pages = {
      about: ["사이트 소개", "고교학점제 환경에서 탐구보고서를 어떻게 설계하고 설명할지 정리하는 교육 정보 사이트입니다. 학년, 과목, 계열별 탐구 질문을 세특과 서류기반면접 준비까지 연결해 보여줍니다."],
      author: ["운영자 소개", (site.config.ownerName || "운영자") + "는 " + (site.config.ownerBio || "탐구보고서 작성과 면접 준비 흐름을 정리합니다.")],
      contact: ["문의하기", "탐구보고서 작성, 과목 선택, 세특 연결, 서류기반면접 준비와 관련한 의견이나 오류 제보는 언제든지 연락 주세요."],
      privacy: ["개인정보처리방침", "이 사이트는 회원가입 없이 이용할 수 있으며, 문의 응답에 필요한 최소한의 정보만 확인하는 것을 원칙으로 합니다."],
      terms: ["이용약관", "이 사이트의 콘텐츠는 고등학생과 학부모를 위한 일반 교육 정보 제공을 목적으로 합니다. 학교별 운영 기준과 대학별 공식 안내는 별도로 확인해야 합니다."],
      disclaimer: ["면책고지", "이 사이트는 일반 교육 정보를 제공합니다. 특정 대학 합격, 학생부 평가, 면접 결과를 보장하지 않습니다. 입시 제도와 학교 운영 방식은 달라질 수 있으므로 공식 자료를 함께 확인해야 합니다."],
      sitemap: ["사이트맵", "주요 메뉴와 정보 페이지 구조를 한곳에서 확인할 수 있습니다."]
    };
    var selected = pages[kind] || pages.about;
    var extra = "";

    if (kind === "sitemap") {
      extra = '<div class="grid">' +
        pageLinks().map(function (item) {
          return '<article class="card"><h3><a href="' + url(item.path) + '">' + escapeHtml(item.label) + "</a></h3><p>" + escapeHtml(item.description) + "</p></article>";
        }).join("") +
        "</div>";
    } else if (kind === "about") {
      extra = '<div class="trust-content">' +
        "<h2>이 사이트가 하는 일</h2><p>고교학점제에서는 과목 선택, 수업 활동, 탐구보고서, 세특 기록, 서류기반면접이 따로 움직이지 않습니다. 이 사이트는 학생이 한 번의 탐구를 보고서에서 끝내지 않고, 학생부 기록과 면접 답변까지 설명할 수 있도록 흐름을 정리합니다.</p>" +
        "<h2>누구에게 도움이 되나요?</h2><p>탐구 주제를 어떻게 정해야 할지 막막한 고등학생, 자녀의 과목 선택과 탐구 활동을 함께 이해하고 싶은 학부모, 보고서 내용을 세특과 면접 질문으로 연결하고 싶은 학생에게 도움이 되도록 구성했습니다.</p>" +
        "<h2>콘텐츠 작성 기준</h2><p>이 사이트는 특정 대학 합격이나 학생부 평가 결과를 보장하는 표현을 사용하지 않습니다. 대신 학년, 과목, 진로·계열, 탐구 질문, 자료 조사, 세특 포인트, 면접 꼬리질문을 현실적인 교육 정보 기준으로 연결해 설명합니다.</p>" +
        "<h2>이렇게 활용해 보세요</h2><p>처음 방문했다면 학년별 탐구보고서에서 현재 단계의 깊이를 확인하고, 과목별 탐구보고서에서 수업 개념과 연결한 질문을 찾아보세요. 이후 진로·계열별 글로 방향을 좁히고, 면접 대비 글과 칼럼을 통해 보고서 내용을 말로 설명하는 연습까지 이어가면 좋습니다.</p>" +
        "</div>";
    } else if (kind === "author") {
      extra = '<div class="trust-content">' +
        "<h2>운영자 소개</h2><p>" + escapeHtml(site.config.ownerName || "탐구가이드 편집팀") + "는 고교학점제 환경에서 학생의 과목 선택, 탐구보고서 작성, 세특 기록, 서류기반면접 준비가 어떻게 연결되는지 정리하는 교육 콘텐츠 운영자입니다. 단순히 좋은 주제를 나열하기보다, 학생이 자신의 탐구 과정을 이해하고 말로 설명할 수 있도록 구조화된 안내를 만드는 데 초점을 둡니다.</p>" +
        "<h2>전문성의 기준</h2><p>탐구보고서는 학년, 과목, 진로·계열, 수업 개념, 자료 조사 수준에 따라 작성 방향이 달라집니다. 운영자는 이 요소들을 분리해서 보지 않고, 보고서 주제 선정부터 세특 포인트, 면접 꼬리질문까지 이어지는 흐름을 기준으로 콘텐츠를 구성합니다.</p>" +
        "<h2>콘텐츠 검토 관점</h2><p>합격을 보장하는 표현, 과장된 성과 표현, 학생이 실제로 설명하기 어려운 문장은 피합니다. 대신 주제 선택 이유, 탐구 과정, 근거 자료, 한계와 보완점, 후속 질문처럼 학생이 서류기반면접에서 직접 답할 수 있는 요소를 중심으로 안내합니다.</p>" +
        "<h2>운영 철학</h2><p>이 사이트는 보고서를 대신 써주는 곳이 아니라, 학생이 자기 탐구를 더 분명하게 이해하도록 돕는 정보 사이트입니다. 좋은 탐구는 멋진 제목보다 좋은 질문에서 시작하고, 좋은 기록은 면접에서 다시 설명할 수 있을 때 더 힘을 갖는다고 봅니다.</p>" +
        "</div><div class=\"grid two trust-grid\">" +
        '<article class="panel"><h2>운영 원칙</h2><p>학생의 실제 수업 경험과 탐구 과정이 드러나도록 안내합니다. 대리 작성, 표절, 근거 없는 결과 중심 서술은 권하지 않습니다.</p></article>' +
        '<article class="panel"><h2>콘텐츠 기준</h2><p>학년별 깊이, 과목별 개념, 진로·계열 적합성, 세특 연결, 서류기반면접 질문까지 함께 고려해 글을 구성합니다.</p></article>' +
        "</div>";
    } else if (kind === "contact") {
      extra = '<div class="contact-stack">' +
        '<div class="contact-email-card"><div class="contact-icon" aria-hidden="true">&#9993;</div><div><strong>이메일로 직접 문의</strong><a href="mailto:' + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + '">' + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + "</a></div></div>" +
        '<div class="contact-note"><span aria-hidden="true">&#9716;</span><div><strong>운영 안내</strong><p>문의는 평일 기준 1~3일 이내에 답변드립니다. 주말 및 공휴일에는 답변이 늦어질 수 있습니다.</p></div></div>' +
        '<section class="contact-form-panel"><h2>문의 양식</h2><div class="form-alert"><span aria-hidden="true">!</span> 문의 내용을 작성하면 Gmail 작성창이 열립니다. 창이 열리지 않으면 아래에 표시되는 내용을 복사해 직접 보내 주세요.</div>' +
        '<form class="contact-form" data-contact-form data-contact-email="' + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + '" action="mailto:' + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + '" method="post" enctype="text/plain">' +
        '<div class="form-row"><label>이름<input name="name" type="text" placeholder="홍길동" required></label><label>이메일<input name="email" type="email" placeholder="example@email.com" required></label></div>' +
        '<label>제목<input name="subject" type="text" placeholder="문의 제목을 입력해 주세요" required></label>' +
        '<label>내용<textarea name="message" placeholder="문의 내용을 입력해 주세요" required></textarea></label>' +
        '<button class="button primary contact-submit" type="submit">Gmail로 문의 작성하기</button>' +
        '<div class="contact-fallback" data-contact-fallback hidden></div>' +
        "</form></section></div>";
    } else if (kind === "privacy") {
      extra = '<div class="trust-content">' +
        '<p class="doc-updated">최종 업데이트: 2026-06-06</p>' +
        "<h2>1. 총칙</h2><p>" + escapeHtml(site.config.name || "고교학점제 탐구가이드") + '는 고교학점제, 탐구보고서, 세특 연결, 서류기반면접 준비와 관련한 교육 정보를 제공하는 사이트입니다. 본 방침은 사이트 이용 과정에서 처리될 수 있는 개인정보의 기준과 보호 방법을 안내합니다.</p>' +
        "<h2>2. 수집하는 정보</h2><p>사이트는 회원가입, 댓글, 결제 기능을 제공하지 않으므로 로그인 정보를 수집하지 않습니다. 다만 서비스 운영 과정에서 접속 로그, 브라우저 정보, 방문 일시가 확인될 수 있으며, 이용자가 이메일로 문의하는 경우 이름, 이메일 주소, 문의 내용이 확인될 수 있습니다.</p>" +
        "<h2>3. 이용 목적</h2><p>수집된 정보는 문의 답변, 사이트 오류 확인, 이상 접속 감지, 콘텐츠 품질 개선, 방문 통계 분석을 위해 사용할 수 있습니다.</p>" +
        "<h2>4. 보관 기간</h2><p>문의로 제공된 개인정보는 문의 처리 완료 후 6개월 이내에 파기하는 것을 원칙으로 합니다. 단, 관련 법령에서 별도의 보관 기간을 정한 경우 해당 기간 동안 보관할 수 있습니다.</p>" +
        "<h2>5. 제3자 제공</h2><p>사이트는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 따른 요청이 있거나 이용자의 명시적 동의가 있는 경우는 예외로 합니다.</p>" +
        "<h2>6. 쿠키 및 분석 도구</h2><p>사이트는 방문자 통계 분석을 위해 쿠키 또는 웹 분석 도구를 사용할 수 있습니다. 이때 수집되는 정보는 개인을 직접 식별하기보다 방문 흐름과 콘텐츠 이용 경향을 파악하기 위한 통계 정보로 활용됩니다.</p>" +
        "<h2>7. 개인정보 보호 책임자</h2><p>이름: " + escapeHtml(site.config.ownerName || "탐구가이드 편집팀") + "<br>이메일: <a href=\"mailto:" + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + "\">" + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + "</a><br>주소: 별도 공개하지 않음</p>" +
        "<h2>8. 이용자의 권리</h2><p>이용자는 자신의 개인정보에 대한 조회, 수정, 삭제를 요청할 수 있습니다. 요청은 위 이메일로 보내주시면 확인 가능한 범위에서 지체 없이 처리하겠습니다.</p>" +
        "</div>";
    } else if (kind === "terms") {
      extra = '<div class="trust-content">' +
        '<p class="doc-updated">최종 업데이트: 2026-06-06</p>' +
        "<h2>1. 목적</h2><p>본 약관은 " + escapeHtml(site.config.name || "고교학점제 탐구가이드") + "의 콘텐츠 이용 조건과 사이트 이용 시 필요한 기본 기준을 안내하기 위해 마련되었습니다.</p>" +
        "<h2>2. 제공 서비스</h2><p>사이트는 고교학점제 이해, 과목 선택, 탐구보고서 작성, 세특 연결, 서류기반면접 준비와 관련한 일반 교육 정보를 제공합니다.</p>" +
        "<h2>3. 콘텐츠 이용</h2><p>사이트의 글은 개인 학습과 진로 탐색을 위한 참고 자료로 이용할 수 있습니다. 출처 표시 없는 무단 복제, 대량 재배포, 상업적 전재, 자동 수집은 제한됩니다.</p>" +
        "<h2>4. 이용자의 책임</h2><p>이용자는 사이트 정보를 참고하되, 학교 교육과정, 담임교사 또는 교과 담당교사의 안내, 대학 입학처의 공식 자료를 함께 확인해야 합니다. 탐구보고서 작성 시 표절, 허위 작성, 대리 작성은 금지됩니다.</p>" +
        "<h2>5. 금지 행위</h2><p>사이트 운영을 방해하는 행위, 허위 정보 제공, 악성 코드 삽입, 자동화 도구를 이용한 과도한 접근, 타인의 권리를 침해하는 행위는 금지됩니다.</p>" +
        "<h2>6. 서비스 변경</h2><p>사이트 구조, 메뉴, 글 목록, 정보 페이지 내용은 더 정확한 정보 제공과 운영상 필요에 따라 사전 안내 없이 수정될 수 있습니다.</p>" +
        "<h2>7. 책임의 제한</h2><p>사이트는 일반 교육 정보를 제공하며, 개별 학생의 평가 결과, 대학 합격 여부, 면접 결과를 보장하지 않습니다.</p>" +
        "<h2>8. 문의</h2><p>약관과 콘텐츠 이용에 관한 문의는 <a href=\"mailto:" + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + "\">" + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + "</a>로 보내주세요.</p>" +
        "</div>";
    } else if (kind === "disclaimer") {
      extra = '<div class="trust-content">' +
        '<p class="doc-updated">최종 업데이트: 2026-06-06</p>' +
        "<h2>1. 정보 제공 목적</h2><p>" + escapeHtml(site.config.name || "고교학점제 탐구가이드") + "의 콘텐츠는 고등학생과 학부모가 고교학점제, 탐구보고서, 세특, 서류기반면접을 이해하도록 돕기 위한 일반 교육 정보입니다.</p>" +
        "<h2>2. 보장하지 않는 사항</h2><p>사이트는 특정 대학 합격, 학생부 평가 결과, 면접 점수, 교과 선택의 유불리, 탐구보고서의 평가 결과를 보장하지 않습니다.</p>" +
        "<h2>3. 개별 상황의 차이</h2><p>학교별 교육과정 편성, 교과 담당교사의 평가 기준, 학생의 진로 희망, 대학별 전형 방식에 따라 적용 결과는 달라질 수 있습니다.</p>" +
        "<h2>4. 공식 자료 확인</h2><p>입시 제도, 대학별 전형, 고교학점제 운영 방식, 학교별 과목 개설 상황은 수시로 변동될 수 있습니다. 최종 판단 전에는 학교 공지, 교육청 자료, 대학 입학처 안내를 함께 확인해야 합니다.</p>" +
        "<h2>5. 외부 링크와 자료</h2><p>사이트가 외부 자료나 기관 안내를 언급하더라도 해당 외부 사이트의 정확성, 최신성, 운영 정책을 보장하지 않습니다.</p>" +
        "<h2>6. 이용자 판단</h2><p>사이트의 예시와 조언은 참고 자료이며, 실제 보고서 작성과 면접 준비는 학생 본인의 학습 과정과 학교 안내를 기준으로 조정해야 합니다.</p>" +
        "<h2>7. 문의</h2><p>잘못된 정보나 수정이 필요한 내용이 있다면 <a href=\"mailto:" + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + "\">" + escapeHtml(site.config.contactEmail || "tamgurit@gmail.com") + "</a>로 알려주세요.</p>" +
        "</div>";
    } else if (kind !== "disclaimer") {
      extra = '<div class="notice-box"><strong>공통 안내</strong><p>이 사이트의 내용은 일반 교육 정보이며, 특정 합격이나 면접 결과를 보장하지 않습니다.</p></div>';
    }

    setMeta(selected[0], selected[1]);
    layout('<section class="section"><div class="container"><h1>' + escapeHtml(selected[0]) + '</h1><p class="lead">' + escapeHtml(selected[1]) + "</p>" + extra + "</div></section>");
    if (kind === "contact") initContactForm();
  }

  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var data = new FormData(form);
      var email = form.getAttribute("data-contact-email") || site.config.contactEmail || "tamgurit@gmail.com";
      var subject = String(data.get("subject") || "탐구가이드 문의").trim();
      var body = [
        "이름: " + String(data.get("name") || "").trim(),
        "답장 이메일: " + String(data.get("email") || "").trim(),
        "",
        "문의 내용:",
        String(data.get("message") || "").trim()
      ].join("\n");
      var mailtoUrl = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var gmailUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(email) + "&su=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var fallback = form.querySelector("[data-contact-fallback]");
      if (fallback) {
        fallback.hidden = false;
        fallback.innerHTML = '<strong>메일 작성창이 열리지 않나요?</strong>' +
          '<p>브라우저에서 새 창이 차단되었거나 Gmail 로그인이 필요할 수 있습니다. 아래 내용을 복사해 <a href="' + mailtoUrl + '">' + escapeHtml(email) + '</a>로 보내 주세요.</p>' +
          '<textarea readonly>' + escapeHtml(body) + '</textarea>';
      }
      var opened = window.open(gmailUrl, "_blank", "noopener");
      if (!opened) window.location.href = mailtoUrl;
    });
  }

  function pageLinks() {
    return [
      { label: "홈", path: "index.html", description: "사이트 첫 화면" },
      { label: "탐구 글", path: "posts/index.html", description: "전체 탐구 글 목록" },
      { label: "학년별 탐구보고서", path: "categories/index.html?slug=grade-guide", description: "고1, 고2, 고3 단계별 작성 방향" },
      { label: "과목별 탐구보고서", path: "categories/index.html?slug=subject-guide", description: "국어, 수학, 과학, 사회, 영어, 정보/AI 과목별 접근" },
      { label: "진로·계열별 탐구보고서", path: "categories/index.html?slug=track-guide", description: "인문사회, 공학, 의생명/보건 등 계열별 주제 설계" },
      { label: "면접 대비", path: "categories/index.html?slug=interview", description: "서류기반면접과 꼬리질문 대비" },
      { label: "분류 전체", path: "categories/index.html", description: "모든 탐구 분류 보기" },
      { label: "칼럼", path: "columns/index.html", description: "운영 칼럼 목록" },
      { label: "소개", path: "about/index.html", description: "사이트 소개" },
      { label: "운영자", path: "author/index.html", description: "운영자와 콘텐츠 기준" },
      { label: "문의하기", path: "contact/index.html", description: "문의 안내" },
      { label: "개인정보처리방침", path: "privacy/index.html", description: "개인정보 처리 기준" },
      { label: "이용약관", path: "terms/index.html", description: "콘텐츠 이용 기준" },
      { label: "면책고지", path: "disclaimer/index.html", description: "정보 이용 전 확인할 안내" }
    ];
  }

  function renderNotFound() {
    setMeta("페이지를 찾을 수 없습니다", "요청한 페이지를 찾을 수 없습니다.");
    layout('<section class="section"><div class="container"><h1>페이지를 찾을 수 없습니다</h1><p class="lead">주소가 바뀌었거나 아직 준비되지 않은 페이지입니다.</p><a class="button primary" href="' + url("index.html") + '">홈으로 이동</a></div></section>');
  }

  var routes = {
    home: renderHome,
    posts: renderPosts,
    categories: renderCategories,
    "post-detail": renderPostDetail,
    columns: renderColumns,
    "column-detail": renderColumnDetail,
    about: function () { renderTrustPage("about"); },
    author: function () { renderTrustPage("author"); },
    contact: function () { renderTrustPage("contact"); },
    privacy: function () { renderTrustPage("privacy"); },
    terms: function () { renderTrustPage("terms"); },
    disclaimer: function () { renderTrustPage("disclaimer"); },
    sitemap: function () { renderTrustPage("sitemap"); },
    "not-found": renderNotFound
  };

  (routes[page] || renderNotFound)();
})();

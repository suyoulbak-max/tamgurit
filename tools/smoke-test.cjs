const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "outputs", "qa");
fs.mkdirSync(outDir, { recursive: true });
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sourceContext = { window: { SiteData: {} } };
vm.createContext(sourceContext);
for (const name of ["site.config", "posts", "columns"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "data", name + ".js"), "utf8"), sourceContext);
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function servePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const requested = clean || "index.html";
  const full = path.resolve(root, requested);
  if (!full.startsWith(root)) return null;
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
    return path.join(full, "index.html");
  }
  return full;
}

const server = http.createServer((req, res) => {
  const file = servePath(req.url || "/");
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404, { "Content-Type": mime[".html"] });
    res.end(fs.readFileSync(path.join(root, "404.html"), "utf8"));
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertHomeSpacing(page) {
  const gaps = await page.evaluate(() => {
    const grid = document.querySelector('[data-page="home"] .section > .container > h2 + .grid');
    const notice = document.querySelector('[data-page="home"] .section > .container > .grid + .notice-box');
    return {
      heading: grid.getBoundingClientRect().top - grid.previousElementSibling.getBoundingClientRect().bottom,
      notice: notice.getBoundingClientRect().top - notice.previousElementSibling.getBoundingClientRect().bottom,
    };
  });
  assert(gaps.heading >= 24 && gaps.notice >= 24, `home boxes need breathing room: ${JSON.stringify(gaps)}`);
}

async function assertNewBadges(page) {
  const badges = await page.locator('.card h3 .new-badge').evaluateAll(nodes => nodes.map(node => ({date:node.dataset.publishedAt,visible:getComputedStyle(node).display !== 'none'})));
  assert(badges.length === await page.locator('.card h3 > a').count(), 'each content card must carry one publication badge');
  const now = Date.now();
  for (const badge of badges) {
    const start = Date.parse(badge.date+'T00:00:00+09:00');
    assert(badge.visible === (start <= now && now < start + 7*86400000), `wrong NEW visibility for ${badge.date}`);
  }
}

(async () => {
  await new Promise((resolve) => server.listen(8123, "127.0.0.1", resolve));
  const launchOptions = fs.existsSync(chromePath)
    ? { headless: true, executablePath: chromePath }
    : { headless: true };
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.context().route("**/*", (route) => {
    if (new URL(route.request().url()).hostname === "127.0.0.1") return route.continue();
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) consoleErrors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto("http://127.0.0.1:8123/", { waitUntil: "networkidle" });
  const homeText = await page.locator("body").innerText();
  assert(homeText.includes("탐구보고서에서"), "home missing hero text");
  assert(homeText.includes("탐구보고서 작성 칼럼"), "home missing columns section");
  assert(await page.locator(".card").count() >= 6, "home should render multiple cards");
  await assertHomeSpacing(page);
  assert(await page.getByRole('navigation', {name:'주요 메뉴'}).getByRole('link', {name:'칼럼·이슈',exact:true}).count() === 1, 'header must expose columns and issues');
  assert(await page.getByRole('link', {name:'입시·교육 이슈 보기',exact:true}).count() === 1, 'home must link to the issue section');
  await assertNewBadges(page);
  await page.screenshot({ path: path.join(outDir, "home-desktop.png"), fullPage: true });

  await page.goto("http://127.0.0.1:8123/posts/grade-3-interview-ready-report.html", { waitUntil: "networkidle" });
  const detailText = await page.locator("body").innerText();
  const detailSource = sourceContext.window.SiteData.posts.find(post => post.slug === "grade-3-interview-ready-report");
  if (!detailSource.fullArticle) {
  assert(detailText.includes("서류기반면접 예상 질문"), "detail missing interview questions");
  assert(detailText.includes("꼬리질문 대비"), "detail missing follow-up questions");
  assert(detailText.includes("초보자가 자주 하는 실수"), "detail missing common mistakes");
  assert(detailText.includes("체크리스트"), "detail missing checklist");
  assert(detailText.includes("자주 묻는 질문"), "detail missing faq");
  } else {
    const headings = Array.from(detailSource.content.matchAll(/<h2>(.*?)<\/h2>/g), match => match[1]);
    const actual = await page.locator('.article-body > h2').allTextContents();
    assert(headings.every((heading,index)=>actual[index]===heading), 'complete detail must preserve authored sections');
  }
  assert(await page.locator(".article-layout").count() === 1, "detail missing article layout");
  assert(await page.locator(".article-body").count() === 1, "detail missing article card");
  assert(await page.locator(".aside .panel").count() >= 3, "detail missing sidebar panels");
  if (!detailSource.fullArticle) assert(await page.locator(".comparison-table").count() >= 1, "detail missing comparison table");
  assert(await page.locator(".article-top-grid .article-brief").count() === 2, "detail missing toc/summary boxes");
  assert((await page.locator('link[rel="canonical"]').getAttribute("href") || "").endsWith("/posts/grade-3-interview-ready-report.html"), "detail canonical must stay clean");
  await page.screenshot({ path: path.join(outDir, "post-detail-desktop.png"), fullPage: true });

  await page.goto("http://127.0.0.1:8123/posts/diabetes-machine-learning-follow-up-four-tracks.html?slug=diabetes-machine-learning-follow-up-four-tracks", { waitUntil: "networkidle" });
  const richDetail = page.locator(".article-body");
  assert(await richDetail.locator("h2", { hasText: "1. 1학년 탐구의 한계 도출과 2~3학년 Bridge 연결" }).count() === 1, "forced client render must preserve rich content h2 heading");
  assert(await richDetail.locator("h3", { hasText: "트랙 A. AI·소프트웨어·데이터사이언스 계열" }).count() === 1, "forced client render must preserve rich content h3 heading");
  assert(await richDetail.locator("blockquote").count() >= 1, "forced client render must preserve rich content blockquote");

  await page.goto("http://127.0.0.1:8123/columns/", { waitUntil: "networkidle" });
  const columnsText = await page.locator("body").innerText();
  assert(columnsText.includes("윤리적 딜레마를 결론부에 담는 구체적 작성법"), "columns missing ethical dilemma column");
  assert(columnsText.includes("인문사회 계열 보고서에서 정책의 양면성을 비판하는 법"), "columns missing policy two-sidedness column");
  const publicColumns = sourceContext.window.SiteData.columns.filter(item => item.status === 'published');
  await assertNewBadges(page);
  assert(await page.locator('#writing .card').count() === publicColumns.filter(item => item.kind !== 'issue').length, 'writing columns must stay in their own section');
  assert(await page.locator('#issues .card').count() === publicColumns.filter(item => item.kind === 'issue').length, 'issue cards must match published content only');
  await page.getByRole('navigation', {name:'칼럼·이슈 바로가기'}).getByRole('link', {name:'입시·교육 이슈',exact:true}).click();
  assert(new URL(page.url()).hash === '#issues', 'issue navigation must reach its real anchor');
  await page.screenshot({path:path.join(outDir,'columns-issues-desktop.png'),fullPage:true});
  await page.screenshot({ path: path.join(outDir, "columns-desktop.png"), fullPage: true });

  await page.goto("http://127.0.0.1:8123/columns/detail.html?slug=how-to-write-ethical-dilemma-conclusion", { waitUntil: "networkidle" });
  const columnDetailText = await page.locator("body").innerText();
  assert(columnDetailText.includes("윤리적 딜레마를 결론부에 담는 구체적 작성법"), "ethical dilemma column detail missing title");
  assert(columnDetailText.includes("브릿지 문단"), "ethical dilemma column detail missing bridge paragraph");

  await page.goto("http://127.0.0.1:8123/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const newSlugs = [
      "grade-2-3-track-evaluation-rubric",
      "track-specific-error-analysis-critical-thinking",
      "track-evaluation-cases-interview-checkpoints",
    ];
    const oldPosts = window.SiteData.posts.filter((post) => !newSlugs.includes(post.slug));
    window.localStorage.setItem("researchGuideData", JSON.stringify({
      config: window.SiteData.config,
      categories: window.SiteData.categories,
      posts: oldPosts,
      columns: window.SiteData.columns,
    }));
  });
  await page.goto("http://127.0.0.1:8123/categories/index.html?slug=track-guide", { waitUntil: "networkidle" });
  const trackText = await page.locator("body").innerText();
  await assertNewBadges(page);
  assert(trackText.includes("고2·고3 전공계열별 탐구보고서 평가 루브릭"), "stored data should merge new track rubric post");
  assert(trackText.includes("전공별 오차 분석과 비판적 사고 작성 전략"), "stored data should merge error-analysis post");
  assert(trackText.includes("계열별 탐구보고서 평가 사례와 면접 검증 포인트"), "stored data should merge evaluation-cases post");
  await page.evaluate(() => window.localStorage.removeItem("researchGuideData"));

  await page.goto("http://127.0.0.1:8123/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const newSlugs = [
      "how-to-write-ethical-dilemma-conclusion",
      "criticize-policy-two-sidedness-humanities-social-report",
    ];
    const oldColumns = window.SiteData.columns.filter((column) => !newSlugs.includes(column.slug));
    window.localStorage.setItem("researchGuideData", JSON.stringify({
      config: window.SiteData.config,
      categories: window.SiteData.categories,
      posts: window.SiteData.posts,
      columns: oldColumns,
    }));
  });
  await page.goto("http://127.0.0.1:8123/columns/", { waitUntil: "networkidle" });
  const mergedColumnsText = await page.locator("body").innerText();
  assert(mergedColumnsText.includes("윤리적 딜레마를 결론부에 담는 구체적 작성법"), "stored data should merge ethical dilemma column");
  assert(mergedColumnsText.includes("인문사회 계열 보고서에서 정책의 양면성을 비판하는 법"), "stored data should merge policy column");
  await page.evaluate(() => window.localStorage.removeItem("researchGuideData"));

  await page.goto("http://127.0.0.1:8123/contact/index.html", { waitUntil: "networkidle" });
  const contactHref = await page.locator('.contact-email-card a').getAttribute("href");
  assert(contactHref === "mailto:" + sourceContext.window.SiteData.config.contactEmail, "contact must expose the configured mail recipient");
  assert(await page.locator("form").count() === 0, "static contact page must not simulate a message submission");
  await page.screenshot({ path: path.join(outDir, "contact-email.png"), fullPage: true });
  await page.goto("http://127.0.0.1:8123/contact/?slug=unknown", { waitUntil: "networkidle" });
  assert(await page.locator("form").count() === 0, "a query must not restore an obsolete contact form");
  await page.goto("http://127.0.0.1:8123/categories/?slug=unknown", { waitUntil: "networkidle" });
  assert(await page.locator(".card").count() > 0, "an unknown category query must preserve the category index");

  const rewrittenPosts = sourceContext.window.SiteData.posts.filter((post) => post.ads === false);
  for (const post of rewrittenPosts) {
    for (const width of [1366, 375]) {
      await page.setViewportSize({ width, height: 900 });
      const requests = [];
      const onRequest = (request) => { if (/googlesyndication|doubleclick|googleadservices/.test(request.url())) requests.push(request.url()); };
      page.on("request", onRequest);
      const response = await page.goto(`http://127.0.0.1:8123/posts/${post.slug}.html`, { waitUntil: "networkidle" });
      assert(response.status() === 200, `${post.slug}: direct navigation failed`);
      assert(await page.locator("h1").innerText() === post.title, `${post.slug}: wrong article`);
      const sourceHeadings = Array.from(post.content.matchAll(/<h2>(.*?)<\/h2>/g), (match) => match[1]);
      const renderedHeadings = await page.locator(".article-body > h2").allTextContents();
      assert(sourceHeadings.every((heading, index) => renderedHeadings[index] === heading), `${post.slug}: incomplete article body`);
      assert(await page.locator('script[src*="adsbygoogle"]').count() === 0 && requests.length === 0, `${post.slug}: advertising must stay excluded`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${post.slug}: horizontal overflow at ${width}`);
      await page.screenshot({ path: path.join(outDir, `${post.slug}-${width}.png`), fullPage: true });
      page.off("request", onRequest);
    }
  }
  await page.goto("http://127.0.0.1:8123/posts/grade-3-interview-ready-report.html?slug=ai-ethics-research-report", { waitUntil: "networkidle" });
  assert(await page.locator("body").getAttribute("data-slug") === "grade-3-interview-ready-report", "query must not substitute a different article on an advertising page");
  assert(await page.locator("h1").innerText() === sourceContext.window.SiteData.posts.find((post) => post.slug === "grade-3-interview-ready-report").title, "query must preserve the canonical article body");
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.goto("http://127.0.0.1:8123/admin/", { waitUntil: "networkidle" });
  const adminLoginText = await page.locator("body").innerText();
  assert(adminLoginText.includes("데모 보기"), "admin missing read-only demo login");
  assert(adminLoginText.includes("수정·삭제·가져오기는 비활성화"), "admin missing read-only warning");
  await page.getByRole("button", { name: "데모 보기" }).click();
  await page.waitForTimeout(100);
  const adminText = await page.locator("body").innerText();
  assert(adminText.includes("대시보드"), "admin missing dashboard");
  assert(adminText.includes("전체 글"), "admin missing post count card");
  await page.screenshot({ path: path.join(outDir, "admin-dashboard-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://127.0.0.1:8123/", { waitUntil: "networkidle" });
  const mobileHeaderBox = await page.locator(".site-header").boundingBox();
  await assertHomeSpacing(page);
  await assertNewBadges(page);
  await page.getByRole('link', {name:'입시·교육 이슈 보기',exact:true}).click();
  assert(new URL(page.url()).hash === '#issues', 'mobile home must link directly to issues');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth), 'mobile issue page must not overflow');
  await page.screenshot({path:path.join(outDir,'columns-issues-mobile.png'),fullPage:true});
  await page.goto("http://127.0.0.1:8123/", { waitUntil: "networkidle" });
  assert(mobileHeaderBox && mobileHeaderBox.width <= 390, "mobile header width overflow");
  await page.screenshot({ path: path.join(outDir, "home-mobile.png"), fullPage: true });

  await page.goto("http://127.0.0.1:8123/posts/grade-3-interview-ready-report.html", { waitUntil: "networkidle" });
  const mobileMetrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
    columns: getComputedStyle(document.querySelector(".article-layout")).gridTemplateColumns,
  }));
  assert(mobileMetrics.bodyWidth <= mobileMetrics.viewportWidth, "mobile post width overflow");
  assert(!mobileMetrics.columns.includes(" "), "mobile post must use one-column layout");
  await page.screenshot({ path: path.join(outDir, "post-detail-mobile.png"), fullPage: true });

  assert(consoleErrors.length === 0, `console errors found:\n${consoleErrors.join("\n")}`);

  await browser.close();
  server.close();
  console.log("Smoke test passed. Screenshots saved to outputs/qa.");
})().catch(async (err) => {
  server.close();
  console.error(err.stack || err.message);
  process.exit(1);
});

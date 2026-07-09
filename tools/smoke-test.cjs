const http = require("http");
const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "outputs", "qa");
fs.mkdirSync(outDir, { recursive: true });
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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

(async () => {
  await new Promise((resolve) => server.listen(8123, "127.0.0.1", resolve));
  const launchOptions = fs.existsSync(chromePath)
    ? { headless: true, executablePath: chromePath }
    : { headless: true };
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
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
  await page.screenshot({ path: path.join(outDir, "home-desktop.png"), fullPage: true });

  await page.goto("http://127.0.0.1:8123/posts/detail.html?slug=grade-1-research-report-start", { waitUntil: "networkidle" });
  const detailText = await page.locator("body").innerText();
  assert(detailText.includes("서류기반면접 예상 질문"), "detail missing interview questions");
  assert(detailText.includes("꼬리질문 대비"), "detail missing follow-up questions");
  assert(detailText.includes("초보자가 자주 하는 실수"), "detail missing common mistakes");
  assert(detailText.includes("체크리스트"), "detail missing checklist");
  assert(detailText.includes("자주 묻는 질문"), "detail missing faq");
  await page.screenshot({ path: path.join(outDir, "post-detail-desktop.png"), fullPage: true });

  await page.goto("http://127.0.0.1:8123/columns/", { waitUntil: "networkidle" });
  const columnsText = await page.locator("body").innerText();
  assert(columnsText.includes("윤리적 딜레마를 결론부에 담는 구체적 작성법"), "columns missing ethical dilemma column");
  assert(columnsText.includes("인문사회 계열 보고서에서 정책의 양면성을 비판하는 법"), "columns missing policy two-sidedness column");
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
  await page.evaluate(() => {
    window.__contactOpenUrl = "";
    window.open = (url) => {
      window.__contactOpenUrl = String(url);
      return { closed: false, focus() {} };
    };
  });
  await page.fill("input[name=name]", "홍길동");
  await page.fill("input[name=email]", "example@email.com");
  await page.fill("input[name=subject]", "탐구보고서 작성문의");
  await page.fill("textarea[name=message]", "탐구보고서 작성 방법을 문의합니다.");
  await page.click(".contact-submit");
  const contactOpenUrl = await page.evaluate(() => window.__contactOpenUrl);
  const fallbackText = await page.locator("[data-contact-fallback]").innerText();
  const fallbackBody = await page.locator("[data-contact-fallback] textarea").inputValue();
  assert(contactOpenUrl.startsWith("https://mail.google.com/mail/"), "contact submit should open Gmail compose URL");
  assert(contactOpenUrl.includes("to=tamgurit%40gmail.com"), "contact Gmail URL missing recipient");
  assert(fallbackText.includes("tamgurit@gmail.com"), "contact fallback missing recipient");
  assert(fallbackBody.includes("탐구보고서 작성 방법을 문의합니다."), "contact fallback missing message body");
  await page.screenshot({ path: path.join(outDir, "contact-gmail-fallback.png"), fullPage: true });

  await page.goto("http://127.0.0.1:8123/admin/", { waitUntil: "networkidle" });
  const adminLoginText = await page.locator("body").innerText();
  assert(adminLoginText.includes("데모 로그인"), "admin missing demo login");
  await page.getByRole("button", { name: "데모 로그인" }).click();
  await page.waitForTimeout(100);
  const adminText = await page.locator("body").innerText();
  assert(adminText.includes("대시보드"), "admin missing dashboard");
  assert(adminText.includes("전체 글"), "admin missing post count card");
  await page.screenshot({ path: path.join(outDir, "admin-dashboard-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://127.0.0.1:8123/", { waitUntil: "networkidle" });
  const mobileHeaderBox = await page.locator(".site-header").boundingBox();
  assert(mobileHeaderBox && mobileHeaderBox.width <= 390, "mobile header width overflow");
  await page.screenshot({ path: path.join(outDir, "home-mobile.png"), fullPage: true });

  assert(consoleErrors.length === 0, `console errors found:\n${consoleErrors.join("\n")}`);

  await browser.close();
  server.close();
  console.log("Smoke test passed. Screenshots saved to outputs/qa.");
})().catch(async (err) => {
  server.close();
  console.error(err.stack || err.message);
  process.exit(1);
});

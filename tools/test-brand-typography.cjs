"use strict";
// Real-browser checks for the shared brand and Korean reading typography.
// All external requests (including advertising) are blocked.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "outputs/qa/brand-20261016");
fs.mkdirSync(output, { recursive: true });
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
const directories = ["about", "author", "categories", "columns", "contact", "disclaimer", "posts", "privacy", "sitemap", "terms"];
const pages = ["index.html", "404.html", ...directories.flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(file => file.endsWith(".html")).map(file => `${dir}/${file}`))]
  .filter(file => /class="brand-mark"|assets\/js\/app\.js/.test(fs.readFileSync(path.join(root, file), "utf8")));
const records = [];
(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext();
    await context.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
    const page = await context.newPage();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const file of pages) {
        await page.goto(base + file, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => {
          const brand = document.querySelector(".site-header .brand");
          const nav = document.querySelector(".site-header .nav");
          const image = brand.querySelector("img");
          const reading = document.querySelector(".article-body p");
          const a = brand.getBoundingClientRect(), b = nav.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            loaded: image.complete && image.naturalWidth > 0,
            overlap: a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top,
            bodyFont: getComputedStyle(document.body).fontFamily,
            suitLoaded: document.fonts.check('400 16px "SUIT Variable"'),
            displayLoaded: document.fonts.check('800 20px "Paperlogy"'),
            readingSize: reading ? parseFloat(getComputedStyle(reading).fontSize) : null,
            homeLinks: [...document.querySelectorAll(".brand")].map(a => ({ name: a.getAttribute("aria-label"), href: a.getAttribute("href") }))
          };
        });
        assert(!metrics.overflow, `${file} at ${width}: page overflow`);
        assert(!metrics.overlap && metrics.loaded, `${file} at ${width}: broken/overlapping logo`);
        assert(metrics.suitLoaded && metrics.displayLoaded, `${file}: fonts did not load`);
        assert(metrics.bodyFont.startsWith('"SUIT Variable"'), `${file}: wrong reading font`);
        assert(metrics.readingSize === null || metrics.readingSize >= 17, `${file}: undersized reading copy`);
        assert.equal(metrics.homeLinks.length, 2, `${file}: header/footer branding missing`);
        for (const link of metrics.homeLinks) {
          assert.equal(link.name, "플러스 리터러시 홈");
          assert.equal(new URL(link.href, base + file).href, base + "index.html");
        }
        const stem = file.replaceAll("/", "-").replace(".html", "") + "-" + width;
        await page.screenshot({ path: path.join(output, stem + "-top.png") });
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, document.body.scrollHeight); });
        await page.screenshot({ path: path.join(output, stem + "-end.png") });
        records.push({ file, width, ...metrics });
      }
    }
    for (const width of [320, 768, 1100, 1101, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `home overflow at ${width}`);
      await page.screenshot({ path: path.join(output, `home-breakpoint-${width}.png`) });
    }
    await page.goto(base);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").textContent(), "본문 바로가기");
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").getAttribute("aria-label"), "플러스 리터러시 홈");
    assert.notEqual(await page.locator(":focus").evaluate(el => getComputedStyle(el).outlineStyle), "none");
    await Promise.all([page.waitForURL(base + "index.html"), page.keyboard.press("Enter")]);
    assert.equal(page.url(), base + "index.html");
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ pages: pages.length, widths: [390, 1440], records, keyboard: "PASS", themes: "Existing light theme; no dark theme introduced", externalRequests: "blocked" }, null, 2));
    console.log(`Brand/typography PASS: ${pages.length} pages, ${records.length} viewport checks, 5 additional breakpoints, keyboard home link, local font loading.`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

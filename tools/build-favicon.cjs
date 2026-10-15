"use strict";
// Rasterize the existing SVG brand mark without changing its artwork.
// Run manually when the mark changes; deployed files require no browser runtime.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 192, height: 192 }, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(path.join(root, "assets/icons/plus-literacy.svg"), "utf8");
    await page.setContent('<style>html,body{margin:0;width:192px;height:192px}svg{display:block;width:100%;height:100%}</style>' + svg);
    const png = await page.screenshot({ omitBackground: true });
    fs.writeFileSync(path.join(root, "favicon.png"), png);
    // ICO container with a PNG image entry, supported by modern icon clients.
    const header = Buffer.alloc(22);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header[6] = 192;
    header[7] = 192;
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);
    fs.writeFileSync(path.join(root, "favicon.ico"), Buffer.concat([header, png]));
    console.log("Generated favicon.png and favicon.ico from the brand SVG (192 x 192).");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

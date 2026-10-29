// Exports practice-test-trophy.svg -> transparent WebP (2x) for apps/dashboard/public/images.
// usage: node docs/design-assets/export-trophy.js <playwright-core path> <out.webp> [preview.png]
// (needs any installed playwright-core + a Chromium; nothing else.)
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.argv[2]);
const out = process.argv[3];
const preview = process.argv[4];

(async () => {
  const svg = fs.readFileSync(path.join(__dirname, "practice-test-trophy.svg"), "utf8");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent("<html><body></body></html>");
  const result = await page.evaluate(async (svgText) => {
    const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const scale = 2;
    const c = document.createElement("canvas");
    c.width = 480 * scale; c.height = 400 * scale;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { webp: c.toDataURL("image/webp", 0.92), png: c.toDataURL("image/png") };
  }, svg);
  fs.writeFileSync(out, Buffer.from(result.webp.split(",")[1], "base64"));
  if (preview) fs.writeFileSync(preview, Buffer.from(result.png.split(",")[1], "base64"));
  await browser.close();
  console.log("wrote", out, Math.round(fs.statSync(out).size / 1024) + " KB");
})();

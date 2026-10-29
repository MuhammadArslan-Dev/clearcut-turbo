// Builds the Topic Test result illustrations (SVG sources + transparent 2x WebP exports).
// usage: node docs/design-assets/build-topic-test-art.js <playwright-core path> <out dir> [preview dir]
// Writes docs/design-assets/topic-test-{badge,checklist,books}.svg and <out dir>/topic-test-*.webp.
// (needs any installed playwright-core + a Chromium; nothing else.)
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.argv[2]);
const outDir = process.argv[3];
const previewDir = process.argv[4];

// ---- badge: 12-lobe scalloped seal + check --------------------------------
function sealPath(cx, cy, r, amp, lobes) {
  const pts = [];
  const n = 240;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rr = r + amp * Math.cos(lobes * t);
    pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
  }
  return "M" + pts.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
}

const badge = {
  w: 240,
  h: 240,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <!-- Source of public/images/topic-test-badge.webp -->
  <defs>
    <linearGradient id="g" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#5df58a"/>
      <stop offset="0.55" stop-color="#2fdc6a"/>
      <stop offset="1" stop-color="#1bb852"/>
    </linearGradient>
    <radialGradient id="hl" cx="0.35" cy="0.25" r="0.6">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#0b7a33" flood-opacity="0.35"/>
    </filter>
    <filter id="cs" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0b6a2c" flood-opacity="0.35"/>
    </filter>
  </defs>
  <path d="${sealPath(120, 118, 84, 7, 12)}" fill="url(#g)" filter="url(#sh)"/>
  <path d="${sealPath(120, 118, 84, 7, 12)}" fill="url(#hl)"/>
  <path d="${sealPath(120, 118, 70, 5, 12)}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="3"/>
  <path d="M82 120 L108 146 L160 92" fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" filter="url(#cs)"/>
</svg>`,
};

// ---- checklist card --------------------------------------------------------
function row(y, w) {
  return `<g transform="translate(0 ${y})">
      <rect x="22" y="0" width="38" height="38" rx="10" fill="url(#cb)"/>
      <path d="M31 19 L39 27 L52 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="78" y="6" width="${w}" height="10" rx="5" fill="#bcd6fb"/>
      <rect x="78" y="22" width="${w - 36}" height="10" rx="5" fill="#d6e5fd"/>
    </g>`;
}
const checklist = {
  w: 300,
  h: 300,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <!-- Source of public/images/topic-test-checklist.webp -->
  <defs>
    <linearGradient id="cb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b8dff"/>
      <stop offset="1" stop-color="#1f62e0"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#eaf2ff"/>
    </linearGradient>
    <linearGradient id="star" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd566"/>
      <stop offset="1" stop-color="#f4a712"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="150%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#2a62c9" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g transform="rotate(-12 150 160)">
    <rect x="40" y="62" width="190" height="210" rx="22" fill="url(#card)" filter="url(#sh)"/>
    <rect x="40" y="62" width="190" height="210" rx="22" fill="none" stroke="#ffffff" stroke-width="3"/>
    <g transform="translate(40 92)">
      ${row(0, 92)}
      ${row(62, 92)}
      ${row(124, 92)}
    </g>
  </g>
  <path d="M252 96 L261 118 L284 120 L266 136 L272 159 L252 146 L232 159 L238 136 L220 120 L243 118 Z" fill="url(#star)" stroke="#f4a712" stroke-width="3" stroke-linejoin="round"/>
  <rect x="236" y="40" width="9" height="24" rx="4.5" fill="#4a9bff" transform="rotate(20 240 52)"/>
  <rect x="254" y="190" width="9" height="26" rx="4.5" fill="#8dbcff" transform="rotate(55 258 203)"/>
</svg>`,
};

// ---- books -----------------------------------------------------------------
const books = {
  w: 300,
  h: 270,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 270" width="300" height="270">
  <!-- Source of public/images/topic-test-books.webp -->
  <defs>
    <linearGradient id="cv" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5aa6ff"/>
      <stop offset="1" stop-color="#2468e6"/>
    </linearGradient>
    <linearGradient id="cv2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4896ff"/>
      <stop offset="1" stop-color="#1d58d4"/>
    </linearGradient>
    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#dfe9fb"/>
    </linearGradient>
    <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd566"/>
      <stop offset="1" stop-color="#f4a712"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="150%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#2a62c9" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#sh)" transform="rotate(-6 150 170)">
    <!-- bottom book -->
    <rect x="30" y="150" width="236" height="78" rx="22" fill="url(#cv2)"/>
    <rect x="44" y="164" width="214" height="46" rx="12" fill="url(#pg)"/>
    <rect x="30" y="196" width="236" height="32" rx="16" fill="url(#cv2)"/>
    <path d="M222 196 L222 242 L236 232 L250 242 L250 196 Z" fill="url(#bm)"/>
    <!-- top book -->
    <rect x="52" y="86" width="226" height="74" rx="22" fill="url(#cv)"/>
    <rect x="66" y="100" width="204" height="42" rx="12" fill="url(#pg)"/>
    <rect x="52" y="130" width="226" height="30" rx="15" fill="url(#cv)"/>
    <path d="M80 100 L252 100" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round"/>
  </g>
  <rect x="198" y="26" width="9" height="30" rx="4.5" fill="#ffb92e" transform="rotate(-12 202 41)"/>
  <rect x="236" y="14" width="9" height="30" rx="4.5" fill="#ffb92e" transform="rotate(8 240 29)"/>
  <rect x="270" y="40" width="9" height="28" rx="4.5" fill="#ffb92e" transform="rotate(62 274 54)"/>
</svg>`,
};

const assets = { badge, checklist, books };

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  if (previewDir) fs.mkdirSync(previewDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent("<html><body></body></html>");
  for (const [name, a] of Object.entries(assets)) {
    fs.writeFileSync(path.join(__dirname, `topic-test-${name}.svg`), a.svg);
    const result = await page.evaluate(
      async ({ svgText, w, h }) => {
        const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = url;
        });
        const scale = 2;
        const c = document.createElement("canvas");
        c.width = w * scale;
        c.height = h * scale;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        return { webp: c.toDataURL("image/webp", 0.9), png: c.toDataURL("image/png") };
      },
      { svgText: a.svg, w: a.w, h: a.h },
    );
    const out = path.join(outDir, `topic-test-${name}.webp`);
    fs.writeFileSync(out, Buffer.from(result.webp.split(",")[1], "base64"));
    if (previewDir) fs.writeFileSync(path.join(previewDir, `topic-test-${name}.png`), Buffer.from(result.png.split(",")[1], "base64"));
    console.log("wrote", out, Math.round(fs.statSync(out).size / 1024) + " KB");
  }
  await browser.close();
})();

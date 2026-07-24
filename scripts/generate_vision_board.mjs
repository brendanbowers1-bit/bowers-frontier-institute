import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const width = 1200;
const height = 800;

const categories = [
  {
    path: "vision-board/BFI/architecture",
    label: "BFI Architecture",
    mood: "quiet academic architecture",
    palette: ["#050505", "#F7F6F2", "#CFCFC8", "#B89A5D"],
  },
  {
    path: "vision-board/BFI/websites",
    label: "BFI Websites",
    mood: "editorial research website",
    palette: ["#F7F6F2", "#FFFFFF", "#050505", "#B89A5D"],
  },
  {
    path: "vision-board/BFI/logos",
    label: "BFI Logos",
    mood: "monolith aperture mark",
    palette: ["#050505", "#FFFFFF", "#CFCFC8", "#B89A5D"],
  },
  {
    path: "vision-board/BFI/typography",
    label: "BFI Typography",
    mood: "old-style serif hierarchy",
    palette: ["#F7F6F2", "#050505", "#CFCFC8", "#B89A5D"],
  },
  {
    path: "vision-board/BR3N/inspiration",
    label: "BR3N",
    mood: "black glass AI system",
    palette: ["#050505", "#1B1B1B", "#D8D8D2", "#B89A5D"],
  },
  {
    path: "vision-board/OLTRE/inspiration",
    label: "OLTRE",
    mood: "matte black stone luxury",
    palette: ["#050505", "#1B1B1B", "#F1F0EC", "#BDB8AD"],
  },
  {
    path: "vision-board/SOLGLIA/inspiration",
    label: "SOLGLIA",
    mood: "executive intelligence precision",
    palette: ["#07080A", "#101418", "#CFCFC8", "#9FB6C8"],
  },
  {
    path: "vision-board/ui-components",
    label: "UI Components",
    mood: "minimal component grammar",
    palette: ["#F7F6F2", "#FFFFFF", "#050505", "#CFCFC8"],
  },
  {
    path: "vision-board/animations",
    label: "Animations",
    mood: "subtle motion frames",
    palette: ["#050505", "#1B1B1B", "#F7F6F2", "#B89A5D"],
  },
  {
    path: "vision-board/photography",
    label: "Photography",
    mood: "cinematic monochrome research",
    palette: ["#050505", "#F7F6F2", "#CFCFC8", "#1B1B1B"],
  },
  {
    path: "vision-board/icons",
    label: "Icons",
    mood: "thin-line symbolic system",
    palette: ["#F7F6F2", "#050505", "#B89A5D", "#CFCFC8"],
  },
  {
    path: "vision-board/color-palettes",
    label: "Color Palettes",
    mood: "restrained material palette",
    palette: ["#050505", "#FFFFFF", "#F7F6F2", "#CFCFC8", "#B89A5D"],
  },
];

const concepts = [
  "aperture",
  "monolith",
  "editorial-grid",
  "horizon",
  "negative-space",
];

function renderCard(category, concept, index) {
  const [a, b, c, d, e = d] = category.palette;
  const dark = luminance(a) < 0.25;
  const fg = dark ? "#F7F6F2" : "#050505";
  const muted = dark ? "rgba(247,246,242,0.58)" : "rgba(5,5,5,0.54)";
  const accent = d;
  const shape = shapes[concept]({ a, b, c, d, e, fg, accent, index });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(category.label)} - ${escapeXml(concept)}</title>
  <desc id="desc">Original BFI ecosystem vision-board reference: ${escapeXml(category.mood)}.</desc>
  <rect width="${width}" height="${height}" fill="${a}"/>
  <rect x="40" y="40" width="1120" height="720" fill="${b}" opacity="${dark ? "0.035" : "0.72"}"/>
  <path d="M92 118 H1108" stroke="${fg}" stroke-opacity="0.12"/>
  <path d="M92 682 H1108" stroke="${fg}" stroke-opacity="0.12"/>
  ${shape}
  <text x="92" y="104" fill="${fg}" font-family="Georgia, serif" font-size="34" letter-spacing="5">${escapeXml(category.label)}</text>
  <text x="92" y="704" fill="${accent}" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="17" letter-spacing="4">${escapeXml(concept.toUpperCase())}</text>
  <text x="1108" y="704" fill="${muted}" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="15" letter-spacing="3" text-anchor="end">${escapeXml(category.mood.toUpperCase())}</text>
</svg>
`;
}

const shapes = {
  aperture: ({ fg, accent }) => `
  <circle cx="600" cy="390" r="226" fill="none" stroke="${fg}" stroke-opacity="0.16" stroke-width="2"/>
  <path d="M456 270 L600 190 L744 270" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M476 296 V548 M724 296 V548" stroke="${fg}" stroke-opacity="0.72" stroke-width="12" stroke-linecap="round"/>
  <path d="M600 316 V500" stroke="${fg}" stroke-opacity="0.32" stroke-width="4" stroke-linecap="round"/>
  <path d="M384 538 C470 492 534 482 600 482 C666 482 730 492 816 538" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`,
  monolith: ({ fg, accent }) => `
  <rect x="454" y="190" width="292" height="378" fill="none" stroke="${fg}" stroke-opacity="0.72" stroke-width="10"/>
  <rect x="590" y="214" width="20" height="330" fill="${accent}"/>
  <path d="M506 600 H694" stroke="${fg}" stroke-opacity="0.22" stroke-width="3"/>`,
  "editorial-grid": ({ fg, accent }) => `
  <rect x="328" y="202" width="544" height="356" fill="none" stroke="${fg}" stroke-opacity="0.22"/>
  <path d="M328 318 H872 M328 440 H872 M510 202 V558 M692 202 V558" stroke="${fg}" stroke-opacity="0.12"/>
  <rect x="358" y="232" width="286" height="72" fill="${fg}" opacity="0.72"/>
  <rect x="358" y="474" width="156" height="14" fill="${accent}"/>
  <rect x="358" y="504" width="318" height="10" fill="${fg}" opacity="0.24"/>`,
  horizon: ({ fg, accent }) => `
  <path d="M280 426 C386 342 494 318 600 328 C714 338 810 390 920 472" fill="none" stroke="${fg}" stroke-opacity="0.16" stroke-width="46" stroke-linecap="round"/>
  <path d="M282 438 C390 368 500 350 600 358 C714 367 810 410 918 484" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="600" cy="358" r="10" fill="${accent}"/>`,
  "negative-space": ({ fg, accent }) => `
  <rect x="382" y="196" width="436" height="396" fill="${fg}" opacity="0.08"/>
  <circle cx="600" cy="394" r="144" fill="${fg}" opacity="0.74"/>
  <rect x="574" y="238" width="52" height="312" fill="${accent}"/>
  <path d="M484 512 C528 488 562 480 600 480 C638 480 672 488 716 512" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`,
};

for (const category of categories) {
  mkdirSync(join(root, category.path), { recursive: true });
  concepts.forEach((concept, index) => {
    const file = join(category.path, `${String(index + 1).padStart(2, "0")}-${concept}.svg`);
    writeFileSync(join(root, file), renderCard(category, concept, index), "utf8");
  });
}

console.log(`Generated ${categories.length * concepts.length} original SVG vision-board images.`);

function luminance(hex) {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

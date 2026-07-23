import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "vision-board/design-concepts");
mkdirSync(outDir, { recursive: true });

const concepts = [
  ["01-light-aperture", "The Light Aperture", lightAperture],
  ["02-ring-gate", "The Ring Gate", ringGate],
  ["03-luxury-monogram", "Luxury Monogram Studies", monogram],
  ["04-black-ribbon", "The Black Ribbon Object", ribbon],
  ["05-eclipse-path", "The Eclipse Path", eclipse],
  ["06-electric-wordmark", "Electric Wordmark", electric],
  ["07-editorial-portrait", "Monochrome Editorial Study", portrait],
  ["08-circle-systems", "Circle Systems", circles],
];

for (const [slug, title, render] of concepts) {
  writeFileSync(join(outDir, `${slug}.svg`), wrap(title, render()), "utf8");
}

console.log(`Generated ${concepts.length} original design concept boards.`);

function wrap(title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Original BFI ecosystem design concept board.</desc>
  <rect width="1200" height="1600" fill="#050505"/>
  ${body}
  <text x="80" y="1480" fill="#F7F6F2" font-family="Georgia, serif" font-size="46" letter-spacing="3">${title}</text>
  <text x="80" y="1534" fill="#B89A5D" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="18" letter-spacing="5">BFI ECOSYSTEM CONCEPT</text>
</svg>
`;
}

function lightAperture() {
  return `
  <rect width="1200" height="1600" fill="#030303"/>
  <path d="M602 0 V1320" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round"/>
  <path d="M602 0 V1320" stroke="#FFFFFF" stroke-width="74" stroke-opacity="0.12"/>
  <path d="M250 920 C420 780 512 780 602 900 C706 1040 850 990 980 860" fill="none" stroke="#F7F6F2" stroke-opacity="0.18" stroke-width="78" stroke-linecap="round"/>
  <path d="M178 1280 H1022" stroke="#FFFFFF" stroke-opacity="0.44"/>
  <path d="M600 1280 C584 1360 584 1410 600 1454 C616 1410 616 1360 600 1280" fill="#FFFFFF" opacity="0.52"/>`;
}

function ringGate() {
  return `
  <rect x="210" y="290" width="780" height="760" fill="none" stroke="#B89A5D" stroke-width="20"/>
  <circle cx="600" cy="670" r="270" fill="none" stroke="#B89A5D" stroke-width="26"/>
  <circle cx="600" cy="286" r="70" fill="#050505" stroke="#B89A5D" stroke-width="16"/>
  <path d="M600 160 V1200" stroke="#FF6A21" stroke-opacity="0.62" stroke-width="32"/>
  <path d="M600 160 V1200" stroke="#F7F6F2" stroke-opacity="0.18" stroke-width="94"/>
  <circle cx="600" cy="1120" r="18" fill="#F7F6F2"/>`;
}

function monogram() {
  return `
  <text x="600" y="780" fill="#F7F6F2" font-family="Georgia, serif" font-size="430" text-anchor="middle" letter-spacing="-44">AE</text>
  <path d="M374 858 C500 742 690 742 824 858" fill="none" stroke="#F7F6F2" stroke-width="12" stroke-linecap="round"/>
  <circle cx="600" cy="760" r="360" fill="none" stroke="#F7F6F2" stroke-opacity="0.14"/>`;
}

function ribbon() {
  return `
  <path d="M410 360 C780 230 890 560 602 700 C326 836 412 1178 804 1028" fill="none" stroke="#1B1B1B" stroke-width="150" stroke-linecap="round"/>
  <path d="M410 360 C780 230 890 560 602 700 C326 836 412 1178 804 1028" fill="none" stroke="#B89A5D" stroke-opacity="0.42" stroke-width="8" stroke-linecap="round"/>
  <path d="M792 420 C520 324 320 538 520 760 C724 988 958 1050 742 1240" fill="none" stroke="#1B1B1B" stroke-width="150" stroke-linecap="round"/>
  <path d="M792 420 C520 324 320 538 520 760 C724 988 958 1050 742 1240" fill="none" stroke="#F7F6F2" stroke-opacity="0.18" stroke-width="9" stroke-linecap="round"/>`;
}

function eclipse() {
  return `
  <circle cx="600" cy="520" r="180" fill="#050505" stroke="#F7F6F2" stroke-opacity="0.22" stroke-width="8"/>
  <path d="M600 120 V890" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
  <path d="M600 120 V890" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="90"/>
  <path d="M280 1330 C380 1120 500 1010 600 930 C690 858 780 760 936 600" fill="none" stroke="#F7F6F2" stroke-width="42" stroke-linecap="round"/>
  <circle cx="380" cy="1238" r="12" fill="#F7F6F2"/>`;
}

function electric() {
  return `
  <text x="600" y="820" fill="#F7F6F2" font-family="Georgia, serif" font-size="210" text-anchor="middle" letter-spacing="26">BR3N</text>
  <circle cx="600" cy="736" r="320" fill="none" stroke="#FFFFFF" stroke-opacity="0.08"/>
  <circle cx="600" cy="736" r="330" fill="none" stroke="#B89A5D" stroke-opacity="0.34" stroke-dasharray="1 18" stroke-width="10"/>
  <circle cx="600" cy="736" r="274" fill="none" stroke="#FFFFFF" stroke-opacity="0.22" stroke-dasharray="1 12" stroke-width="7"/>`;
}

function portrait() {
  return `
  <path d="M414 450 C480 320 730 320 790 470 C850 628 744 800 600 800 C456 800 350 620 414 450Z" fill="#CFCFC8" opacity="0.24"/>
  <path d="M360 982 C420 850 780 850 840 982 V1240 H360 Z" fill="#F7F6F2" opacity="0.08"/>
  <path d="M456 610 H544 M656 610 H744" stroke="#F7F6F2" stroke-opacity="0.7" stroke-width="8" stroke-linecap="round"/>
  <path d="M600 650 V760" stroke="#B89A5D" stroke-opacity="0.7" stroke-width="6"/>
  <path d="M520 820 C570 852 632 852 682 820" fill="none" stroke="#F7F6F2" stroke-opacity="0.36" stroke-width="6" stroke-linecap="round"/>`;
}

function circles() {
  return `
  <circle cx="360" cy="700" r="150" fill="none" stroke="#F7F6F2" stroke-width="12"/>
  <circle cx="600" cy="700" r="150" fill="none" stroke="#F7F6F2" stroke-width="12"/>
  <circle cx="840" cy="700" r="150" fill="none" stroke="#F7F6F2" stroke-width="12"/>
  <path d="M210 1010 H990" stroke="#F7F6F2" stroke-opacity="0.14"/>
  <path d="M360 850 V1010 M600 850 V1010 M840 850 V1010" stroke="#B89A5D" stroke-opacity="0.5"/>
  <text x="360" y="1076" fill="#CFCFC8" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="22" text-anchor="middle">BFI</text>
  <text x="600" y="1076" fill="#CFCFC8" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="22" text-anchor="middle">BR3N</text>
  <text x="840" y="1076" fill="#CFCFC8" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="22" text-anchor="middle">SOLGLIA</text>`;
}

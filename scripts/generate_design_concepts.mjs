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
  ["09-luminous-field", "The Luminous Field", luminousField],
  ["10-cut-column", "The Cut Column", cutColumn],
  ["11-noir-founder-editorial", "Noir Founder Editorial", noirEditorial],
  ["12-city-palimpsest", "City Palimpsest", cityPalimpsest],
  ["13-native-security-panel", "Native Security Panel", securityPanel],
  ["14-anatomy-poster", "Anatomy Poster", anatomyPoster],
  ["15-botanical-restraint", "Botanical Restraint", botanical],
  ["16-institutional-crest", "Institutional Crest System", institutionalCrest],
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

function luminousField() {
  return `
  <radialGradient id="fieldGlow" cx="50%" cy="46%" r="42%">
    <stop offset="0%" stop-color="#F7F6F2" stop-opacity="0.82"/>
    <stop offset="45%" stop-color="#B89A5D" stop-opacity="0.24"/>
    <stop offset="100%" stop-color="#050505" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="1600" fill="#050505"/>
  <circle cx="600" cy="700" r="310" fill="url(#fieldGlow)"/>
  <g fill="none" stroke="#F7F6F2" stroke-opacity="0.14">
    <circle cx="600" cy="700" r="170"/>
    <circle cx="600" cy="700" r="260"/>
    <circle cx="600" cy="700" r="380"/>
    <path d="M600 120 V1120"/>
  </g>
  <path d="M600 902 V1120" stroke="#F7F6F2" stroke-opacity="0.72" stroke-width="8"/>
  <circle cx="600" cy="884" r="18" fill="#F7F6F2"/>`;
}

function cutColumn() {
  return `
  <rect x="530" y="250" width="140" height="790" rx="70" fill="#F7F6F2"/>
  <rect x="494" y="218" width="212" height="72" fill="#F7F6F2"/>
  <rect x="460" y="1040" width="280" height="46" fill="#F7F6F2"/>
  <rect x="430" y="1086" width="340" height="52" fill="#CFCFC8"/>
  <path d="M530 690 L670 580 V720 L530 830 Z" fill="#050505"/>
  <path d="M498 1160 H702" stroke="#F7F6F2" stroke-opacity="0.24"/>`;
}

function noirEditorial() {
  return `
  <rect width="1200" height="1600" fill="#0A0705"/>
  <radialGradient id="noirGlow" cx="58%" cy="42%" r="42%">
    <stop offset="0%" stop-color="#B89A5D" stop-opacity="0.42"/>
    <stop offset="100%" stop-color="#050505" stop-opacity="0"/>
  </radialGradient>
  <rect width="1200" height="1050" fill="url(#noirGlow)"/>
  <path d="M420 980 C470 760 730 760 780 980 L850 1240 H350 Z" fill="#050505"/>
  <circle cx="600" cy="620" r="116" fill="#111"/>
  <path d="M410 760 C520 830 694 826 800 740" stroke="#B89A5D" stroke-opacity="0.28" stroke-width="14" fill="none"/>
  <path d="M220 1050 H980" stroke="#F7F6F2" stroke-opacity="0.1"/>`;
}

function cityPalimpsest() {
  return `
  <rect width="1200" height="1600" fill="#050505"/>
  <g fill="#CFCFC8" opacity="0.2">
    <rect x="170" y="660" width="80" height="390"/>
    <rect x="290" y="560" width="120" height="490"/>
    <rect x="470" y="710" width="90" height="340"/>
    <rect x="610" y="510" width="150" height="540"/>
    <rect x="820" y="620" width="120" height="430"/>
  </g>
  <path d="M150 420 L980 1120 M240 1240 L1040 360 M500 260 V1280" stroke="#F7F6F2" stroke-opacity="0.12"/>
  <path d="M180 980 C440 860 660 860 990 980" stroke="#B89A5D" stroke-opacity="0.42" fill="none"/>
  <text x="940" y="1180" fill="#B89A5D" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="28" letter-spacing="12">BR3N</text>`;
}

function securityPanel() {
  return `
  <rect x="210" y="230" width="780" height="1080" rx="72" fill="#1B1B1B"/>
  <circle cx="292" cy="318" r="42" fill="#2A2A2A" stroke="#CFCFC8" stroke-opacity="0.18"/>
  <path d="M274 300 L310 336 M310 300 L274 336" stroke="#F7F6F2" stroke-width="7" stroke-linecap="round"/>
  <text x="290" y="450" fill="#F7F6F2" font-family="IBM Plex Sans, system-ui" font-size="54" font-weight="600">Recovery Key</text>
  <text x="290" y="535" fill="#CFCFC8" font-family="IBM Plex Sans, system-ui" font-size="36">Required to recover access.</text>
  <rect x="290" y="690" width="620" height="92" rx="46" fill="#2D2D2F"/>
  <text x="600" y="748" fill="#F7F6F2" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="24" text-anchor="middle" letter-spacing="3">LZZQ-B925-TZUH-9YDJ</text>
  <rect x="290" y="1120" width="620" height="100" rx="50" fill="#3B8DF7"/>
  <text x="600" y="1182" fill="#F7F6F2" font-family="IBM Plex Sans, system-ui" font-size="34" text-anchor="middle">Continue</text>`;
}

function anatomyPoster() {
  return `
  <rect x="90" y="140" width="1020" height="1260" fill="#050505" stroke="#F7F6F2" stroke-opacity="0.12"/>
  <path d="M90 520 H1110 M90 960 H1110 M430 520 V1400 M770 520 V1400" stroke="#F7F6F2" stroke-opacity="0.12"/>
  <circle cx="600" cy="420" r="170" fill="#CFCFC8" opacity="0.12"/>
  <path d="M600 260 C710 420 690 550 600 650 C510 550 490 420 600 260Z" fill="#F7F6F2" opacity="0.14"/>
  <text x="130" y="230" fill="#F7F6F2" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="32" letter-spacing="10">BR3N</text>
  <text x="130" y="1050" fill="#CFCFC8" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="18" letter-spacing="4">FIG. 1 / SIGNAL</text>
  <text x="820" y="1050" fill="#CFCFC8" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="18" letter-spacing="4">FIG. 2 / SYSTEM</text>`;
}

function botanical() {
  return `
  <rect width="1200" height="1600" fill="#F7F6F2"/>
  <path d="M600 1200 C590 980 610 760 600 540 C594 420 640 300 714 220" stroke="#050505" stroke-opacity="0.68" fill="none" stroke-width="4"/>
  <path d="M600 790 C500 690 430 560 392 420 M612 860 C730 760 810 650 860 500" stroke="#050505" stroke-opacity="0.44" fill="none" stroke-width="3"/>
  <circle cx="714" cy="220" r="58" fill="none" stroke="#050505" stroke-opacity="0.62" stroke-width="3"/>
  <circle cx="392" cy="420" r="38" fill="none" stroke="#050505" stroke-opacity="0.44" stroke-width="2"/>
  <circle cx="860" cy="500" r="44" fill="none" stroke="#050505" stroke-opacity="0.38" stroke-width="2"/>
  <text x="80" y="1480" fill="#050505" font-family="Georgia, serif" font-size="46" letter-spacing="3">Botanical Restraint</text>
  <text x="80" y="1534" fill="#B89A5D" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="18" letter-spacing="5">BFI MEDICINE / FOUNDATION</text>`;
}

function institutionalCrest() {
  return `
  <path d="M600 230 C710 300 830 320 920 350 V760 C920 980 790 1130 600 1230 C410 1130 280 980 280 760 V350 C370 320 490 300 600 230Z" fill="none" stroke="#F7F6F2" stroke-width="10"/>
  <path d="M600 276 V1160 M330 560 H870 M330 760 H870" stroke="#F7F6F2" stroke-opacity="0.28"/>
  <path d="M388 930 C478 820 540 840 600 900 C660 840 722 820 812 930" fill="none" stroke="#B89A5D" stroke-width="8" stroke-linecap="round"/>
  <text x="470" y="520" fill="#F7F6F2" font-family="Georgia, serif" font-size="170">B</text>
  <text x="650" y="724" fill="#F7F6F2" font-family="Georgia, serif" font-size="170">R</text>
  <text x="560" y="1020" fill="#F7F6F2" font-family="Georgia, serif" font-size="180">3</text>`;
}

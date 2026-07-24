import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [
  fileCheck("BFI homepage component", "src/components/BfiHomepage.jsx", 10),
  fileCheck("BFI homepage CSS", "src/components/BfiHomepage.css", 8),
  fileCheck("Master design system", "brand/design-system.md", 10),
  fileCheck("Brand color tokens", "brand/colors/tokens.css", 6),
  fileCheck("Cursor branding rules", "cursor-rules/branding.md", 6),
  fileCheck("Cursor UI rules", "cursor-rules/ui_rules.md", 6),
  fileCheck("Cursor component rules", "cursor-rules/component_rules.md", 6),
  fileCheck("Cursor design language", "cursor-rules/design_language.md", 6),
  fileCheck("Organization doc", "docs/organization.md", 6),
  fileCheck("Vision board guide", "vision-board/README.md", 6),
  fileCheck("Design concepts brief", "vision-board/design-concepts.md", 6),
  countCheck("Vision board image library", "vision-board", ".svg", 50, 10),
  countCheck("Design concept boards", "vision-board/design-concepts", ".svg", 16, 6),
  phraseCheck("Active app uses BFI homepage", "src/App.jsx", "BfiHomepage", 8),
  phraseCheck("Institution hero", "src/components/BfiHomepage.jsx", "The Bowers Frontier Institute", 6),
  phraseCheck("Civilization line", "src/components/BfiHomepage.jsx", "Exploring questions that reshape civilization.", 6),
  phraseCheck("Discovery mission", "src/components/BfiHomepage.jsx", "Discovering what humanity does not yet know.", 6),
  phraseCheck("Research areas", "src/components/BfiHomepage.jsx", "Artificial Intelligence", 5),
  phraseCheck("Publications section", "src/components/BfiHomepage.jsx", "Publications", 5),
  phraseCheck("Open research section", "src/components/BfiHomepage.jsx", "Open research", 5),
  phraseCheck("Website shortcuts", "src/components/BfiHomepage.jsx", "Website shortcuts", 4),
  phraseCheck("Cinematic image system", "src/components/BfiHomepage.jsx", "Luminous field / research aperture / human scale", 4),
  phraseCheck("Commercialization section", "src/components/BfiHomepage.jsx", "Commercialization", 5),
  phraseCheck("BR3N ecosystem entry", "src/components/BfiHomepage.jsx", "BR3N", 3),
  phraseCheck("SOLGLIA ecosystem entry", "src/components/BfiHomepage.jsx", "SOLGLIA", 3),
  phraseCheck("OLTRE ecosystem entry", "src/components/BfiHomepage.jsx", "OLTRE", 3),
  phraseCheck("BFI palette token", "src/components/BfiHomepage.css", "--bfi-gold", 4),
  phraseCheck("Quick-link styling", "src/components/BfiHomepage.css", "bfi-quick-links", 4),
  phraseCheck("Mobile responsive rule", "src/components/BfiHomepage.css", "@media (max-width: 640px)", 4),
  phraseCheck("Commercial ecosystem", "brand/design-system.md", "SOLGLIA", 4),
  phraseCheck("Luxury academic positioning", "brand/design-system.md", "luxury academic research", 4),
  phraseCheck("Light aperture concept", "vision-board/design-concepts.md", "The Light Aperture", 4),
  phraseCheck("Black ribbon concept", "vision-board/design-concepts.md", "The Black Ribbon Object", 4),
  phraseCheck("Luminous field concept", "vision-board/design-concepts.md", "The Luminous Field", 4),
  phraseCheck("Native security concept", "vision-board/design-concepts.md", "Native Security Panel", 4),
  phraseCheck("Botanical restraint concept", "vision-board/design-concepts.md", "Botanical Restraint", 4),
];

const total = checks.reduce((sum, check) => sum + check.points, 0);
const earned = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);
const score = Math.round((earned / total) * 100);
const threshold = Number(process.env.BFI_QUALITY_TARGET ?? "95");

console.log(`BFI quality score: ${score}/100`);
console.log(`Threshold: ${threshold}/100`);
console.log(`Status: ${score >= threshold ? "PASS" : "FAIL"}`);
console.log("");

for (const check of checks) {
  console.log(`- ${check.passed ? "PASS" : "FAIL"} ${check.name} (${check.points} pts): ${check.detail}`);
}

if (score < threshold) {
  process.exit(1);
}

function fileCheck(name, relativePath, points) {
  const path = join(root, relativePath);
  const passed = existsSync(path);
  return {
    name,
    points,
    passed,
    detail: passed ? relativePath : `Missing ${relativePath}`,
  };
}

function phraseCheck(name, relativePath, phrase, points) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    return { name, points, passed: false, detail: `Missing ${relativePath}` };
  }
  const text = readFileSync(path, "utf8");
  const passed = text.includes(phrase);
  return {
    name,
    points,
    passed,
    detail: passed ? `Found "${phrase}"` : `Missing "${phrase}"`,
  };
}

function countCheck(name, relativePath, extension, minimum, points) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    return { name, points, passed: false, detail: `Missing ${relativePath}` };
  }
  const count = countFiles(path, extension);
  return {
    name,
    points,
    passed: count >= minimum,
    detail: `${count} ${extension} files found; minimum ${minimum}`,
  };
}

function countFiles(path, extension) {
  return readdirSync(path, { withFileTypes: true }).reduce((total, entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return total + countFiles(child, extension);
    return total + (entry.isFile() && entry.name.endsWith(extension) ? 1 : 0);
  }, 0);
}

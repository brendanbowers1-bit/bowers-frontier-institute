import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [
  fileCheck("BR3N dashboard component", "src/components/Br3nDashboard.jsx", 8),
  fileCheck("BR3N crest component", "src/components/Br3nCrest.jsx", 10),
  fileCheck("BR3N metallic ribbon mark", "src/components/Br3nRibbonMark.jsx", 10),
  fileCheck("Premium dashboard CSS", "src/components/Br3nDashboard.css", 8),
  phraseCheck("Dark ribbon logo treatment", "src/components/Br3nRibbonMark.jsx", "metallic ribbon loop mark", 8),
  phraseCheck("Uploaded logo lockup", "src/components/Br3nCrest.jsx", "Macro Labs", 8),
  phraseCheck("Research regime risk brand line", "src/components/Br3nCrest.jsx", "Research · Regime · Risk", 6),
  phraseCheck("Framer Motion transitions", "src/components/Br3nDashboard.jsx", "framer-motion", 8),
  phraseCheck("Recharts charting", "src/components/Br3nDashboard.jsx", "AreaChart", 6),
  phraseCheck("OHLC candles", "src/components/Br3nDashboard.jsx", "CandleChart", 6),
  phraseCheck("Correlation heatmap", "src/components/Br3nDashboard.jsx", "CorrelationHeatmap", 6),
  phraseCheck("Period filters", "src/data/portfolioPerformance.js", "YTD", 5),
  phraseCheck("Asset-class filters", "src/data/portfolioPerformance.js", "Commodities", 5),
  phraseCheck("Responsive mobile layout", "src/components/Br3nDashboard.css", "@media (max-width: 640px)", 6),
  phraseCheck("Glass/metal styling", "src/components/Br3nDashboard.css", "backdrop-filter", 6),
  phraseCheck("Cinematic loading", "src/components/Br3nDashboard.jsx", "Br3nLoader", 5),
  phraseCheck("No execution language", "src/components/Br3nDashboard.jsx", "No execution surface", 6),
  phraseCheck("Mock-data disclosure", "src/components/Br3nDashboard.jsx", "Mock data · no live feeds", 6),
  phraseCheck("Rates navigation target", "src/components/Br3nDashboard.jsx", 'id="rates"', 4),
  phraseCheck("Accessible mobile navigation", "src/components/Br3nDashboard.jsx", "aria-expanded", 4),
  phraseCheck("Visible focus states", "src/components/Br3nDashboard.css", ":focus-visible", 4),
  prohibitedPhraseCheck("No unsupported live API claim", "src/components/Br3nDashboard.jsx", "Live API ready", 4),
  prohibitedPhraseCheck("No unsupported latency claim", "src/components/Br3nDashboard.jsx", "18ms render path", 4),
  fileCheck("FX data module", "src/data/fxRates.js", 3),
  fileCheck("Portfolio data module", "src/data/portfolioPerformance.js", 3),
  fileCheck("Exposure data module", "src/data/currencyExposure.js", 3),
  fileCheck("Yield curve data module", "src/data/yieldCurve.js", 3),
  fileCheck("Volatility data module", "src/data/volatility.js", 3),
  fileCheck("Correlation data module", "src/data/correlations.js", 3),
];

const total = checks.reduce((sum, check) => sum + check.points, 0);
const earned = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);
const score = Math.round((earned / total) * 100);
const threshold = Number(process.env.DASHBOARD_QUALITY_TARGET ?? "95");

console.log(`Dashboard quality score: ${score}/100`);
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

function prohibitedPhraseCheck(name, relativePath, phrase, points) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    return { name, points, passed: false, detail: `Missing ${relativePath}` };
  }
  const text = readFileSync(path, "utf8");
  const passed = !text.includes(phrase);
  return {
    name,
    points,
    passed,
    detail: passed ? `Did not find "${phrase}"` : `Found prohibited phrase "${phrase}"`,
  };
}

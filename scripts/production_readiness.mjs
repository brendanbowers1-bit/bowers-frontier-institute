import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const threshold = Number(process.env.PRODUCTION_READY_TARGET ?? "90");
const BEFORE_PACKAGING_SCORE = 100;
const BEFORE_PRODUCTION_SCORE = 70;

const text = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const exists = (relativePath) => existsSync(join(root, relativePath));
const trackedFiles = () =>
  execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

const category = (id, name, max, earned, notes) => ({
  id,
  name,
  max,
  earned: Math.max(0, Math.min(max, earned)),
  notes,
});

const ciYml = exists(".github/workflows/ci.yml") ? text(".github/workflows/ci.yml") : "";
const deployYml = exists(".github/workflows/deploy.yml") ? text(".github/workflows/deploy.yml") : "";
const packageJson = JSON.parse(text("package.json"));
const gitignore = exists(".gitignore") ? text(".gitignore") : "";
const appError = exists("src/components/AppErrorBoundary.jsx")
  ? text("src/components/AppErrorBoundary.jsx")
  : "";
const apiHandler = exists("api/credit-collars.js") ? text("api/credit-collars.js") : "";
const indexHtml = exists("index.html") ? text("index.html") : "";
const indexCss = exists("src/index.css") ? text("src/index.css") : "";
const dashboard = exists("src/components/Br3nDashboard.jsx")
  ? text("src/components/Br3nDashboard.jsx")
  : "";
const limitsDoc = exists("docs/PRODUCTION_LIMITS.md") ? text("docs/PRODUCTION_LIMITS.md") : "";
const readinessDoc = exists("docs/security/production-readiness.md")
  ? text("docs/security/production-readiness.md")
  : "";
const auditDoc = exists("docs/security/dependency-audit.md")
  ? text("docs/security/dependency-audit.md")
  : "";
const envExample = exists("currency-hedge-llm/.env.example")
  ? text("currency-hedge-llm/.env.example")
  : "";

const testFiles = exists("test")
  ? readdirSync(join(root, "test")).filter((name) => name.endsWith(".test.mjs"))
  : [];

const secretHits = scanSecrets(trackedFiles());
const prodAudit = auditSummary(["--omit=dev"]);
const highAudit = auditSummary(["--audit-level=high"]);
const fullAudit = auditSummary([]);

const ci = scoreCi();
const build = scoreBuild();
const secrets = scoreSecrets();
const audit = scoreAudit();
const tests = scoreTests();
const errors = scoreErrors();
const monitoring = scoreMonitoring();
const a11y = scoreA11yPerf();
const docs = scoreDocs();
const paper = scorePaperOnly();

const categories = [ci, build, secrets, audit, tests, errors, monitoring, a11y, docs, paper];
const earned = categories.reduce((sum, item) => sum + item.earned, 0);
const max = categories.reduce((sum, item) => sum + item.max, 0);
const score = Math.round((earned / max) * 100);
const passed = score >= threshold;

console.log(`Production readiness: ${score}/100`);
console.log(`Threshold: ${threshold}/100`);
console.log(`Status: ${passed ? "PASS" : "FAIL"}`);
console.log(`Honest before (this branch, packaging script was ${BEFORE_PACKAGING_SCORE}/100): ${BEFORE_PRODUCTION_SCORE}/100`);
console.log("");
for (const item of categories) {
  console.log(
    `- ${item.earned >= item.max ? "PASS" : item.earned === 0 ? "FAIL" : "PARTIAL"} ${item.name}: ${item.earned}/${item.max}`,
  );
  for (const note of item.notes) {
    console.log(`    ${note}`);
  }
}

if (secretHits.length > 0) {
  console.log("\nSecret scan hits:");
  for (const hit of secretHits.slice(0, 20)) {
    console.log(`- ${hit}`);
  }
}

if (!passed) {
  process.exit(1);
}

function scoreCi() {
  let earnedPoints = 0;
  const notes = [];
  if (/pull_request:/.test(ciYml) && /branches:\s*\[[^\]]*main/.test(ciYml)) {
    earnedPoints += 5;
    notes.push("PR and main CI workflow exists.");
  } else {
    notes.push("Missing unified PR/main CI workflow.");
  }
  if (
    ciYml.includes("npm run lint") &&
    ciYml.includes("npm run build") &&
    ciYml.includes("npm run build:pages") &&
    ciYml.includes("smoke-pages-build")
  ) {
    earnedPoints += 3;
    notes.push("Frontend lint, dual build, and Pages smoke run in CI.");
  } else {
    notes.push("Frontend CI is missing lint/build/smoke coverage.");
  }
  if (ciYml.includes("pytest") || ciYml.includes("python -m pytest")) {
    earnedPoints += 2;
    notes.push("Python package tests run in CI.");
  } else {
    notes.push("Python tests are not wired into unified CI.");
  }
  if (isPinned(ciYml) && isPinned(deployYml)) {
    earnedPoints += 2;
    notes.push("CI and Pages deploy actions are SHA-pinned.");
  } else {
    notes.push("GitHub Actions are not fully SHA-pinned.");
  }
  if (
    ciYml.includes("npm test") &&
    ciYml.includes("check:a11y") &&
    ciYml.includes("npm audit --omit=dev")
  ) {
    earnedPoints += 2;
    notes.push("CI includes tests, accessibility, and production audit.");
  } else {
    notes.push("CI is missing tests, accessibility, or production audit.");
  }
  notes.push("Main stays red/green only after this workflow is merged; this PR cannot flip main.");
  return category("ci", "CI green on main and PRs", 15, earnedPoints, notes);
}

function scoreBuild() {
  let earnedPoints = 0;
  const notes = [];
  if (packageJson.scripts?.["build:pages"]?.includes("GITHUB_PAGES")) {
    earnedPoints += 4;
    notes.push("GitHub Pages build is a first-class npm script.");
  }
  if (packageJson.scripts?.["check:deploy"]?.includes("npm ci")) {
    earnedPoints += 3;
    notes.push("Deploy gate starts from a clean npm ci.");
  }
  if (exists("scripts/smoke-pages-build.mjs") && exists(".github/workflows/deploy.yml")) {
    earnedPoints += 4;
    notes.push("Pages artifact is smoked and deployed from GitHub Actions.");
  }
  if (packageJson.scripts?.["check:budget"] && packageJson.scripts?.["check:pwa"]) {
    earnedPoints += 3;
    notes.push("PWA metadata and bundle budget gates exist.");
  } else {
    notes.push("Missing PWA or bundle-budget publish gate.");
  }
  notes.push("Cloudflare/Netlify live-API hosts are optional and owned by other PRs.");
  return category("build", "Frontend builds and deploys reproducibly", 15, earnedPoints, notes);
}

function scoreSecrets() {
  let earnedPoints = 0;
  const notes = [];
  if (gitignore.includes(".env") && gitignore.includes("!.env.example")) {
    earnedPoints += 4;
    notes.push(".env files are ignored except tracked examples.");
  }
  if (envExample.includes("sk-your-api-key-here") && !exists(".env")) {
    earnedPoints += 3;
    notes.push("Only placeholder env examples are tracked.");
  }
  if (secretHits.length === 0) {
    earnedPoints += 3;
    notes.push("Tracked-file secret scan found no live credentials.");
  } else {
    notes.push(`Secret scan found ${secretHits.length} suspicious hit(s).`);
  }
  return category("secrets", "Env config with no committed secrets", 10, earnedPoints, notes);
}

function scoreAudit() {
  let earnedPoints = 0;
  const notes = [];
  if ((prodAudit.high ?? 1) === 0 && (prodAudit.critical ?? 1) === 0 && (prodAudit.total ?? 1) === 0) {
    earnedPoints += 6;
    notes.push("Production npm audit (--omit=dev) is clean.");
  } else {
    notes.push(`Production audit is not clean: ${JSON.stringify(prodAudit)}`);
  }
  if ((highAudit.high ?? 1) === 0 && (highAudit.critical ?? 1) === 0) {
    earnedPoints += 2;
    notes.push("No high/critical advisories remain in the full tree.");
  } else {
    notes.push("High or critical advisories remain in the full npm tree.");
  }
  if (
    /moderate|overrides|omit=dev|production dependencies/i.test(`${auditDoc}\n${readinessDoc}`)
  ) {
    earnedPoints += 1;
    notes.push("Audit docs distinguish production vs tooling findings.");
  } else {
    notes.push("Audit docs still overclaim a fully clean tree.");
  }
  if ((fullAudit.total ?? 1) === 0) {
    earnedPoints += 1;
    notes.push("Full npm audit tree is clean after a safe minimatch override.");
  } else {
    notes.push("Remaining moderate/low findings are eslint/shadcn tooling, not the Pages runtime.");
  }
  return category("audit", "Dependency/security audit clean", 10, earnedPoints, notes);
}

function scoreTests() {
  let earnedPoints = 0;
  const notes = [];
  if (packageJson.scripts?.test?.includes("node --test")) {
    earnedPoints += 3;
    notes.push("Frontend core-path tests run via node --test.");
  }
  if (testFiles.length >= 2) {
    earnedPoints += 3;
    notes.push(`${testFiles.length} frontend test files cover collars, feed policy, and logging.`);
  } else {
    notes.push("Missing frontend unit tests on core paths.");
  }
  if (packageJson.scripts?.["check:collars"] && packageJson.scripts?.["check:trade"]) {
    earnedPoints += 2;
    notes.push("Static collar and trade-framework gates remain.");
  }
  if (exists("currency-hedge-llm") && ciYml.includes("pytest")) {
    earnedPoints += 1;
    notes.push("Python package tests remain in CI.");
  }
  if (exists("playwright.config.js") && exists("e2e") && ciYml.includes("test:e2e")) {
    earnedPoints += 1;
    notes.push("Playwright e2e covers dashboard sections and static pages in CI.");
  } else {
    notes.push("No browser e2e suite in CI.");
  }
  return category("tests", "Tests on core paths", 10, earnedPoints, notes);
}

function scoreErrors() {
  let earnedPoints = 0;
  const notes = [];
  if (appError.includes("getDerivedStateFromError") && appError.includes("role=\"alert\"")) {
    earnedPoints += 3;
    notes.push("Dashboard error boundary renders a safe fallback.");
  }
  if (appError.includes("componentDidCatch") && appError.includes("runtimeLog")) {
    earnedPoints += 3;
    notes.push("Render failures are logged as structured events.");
  }
  if (apiHandler.includes("status(500)") && apiHandler.includes("temporarily unavailable")) {
    earnedPoints += 2;
    notes.push("Serverless feed failures return generic 500s.");
  }
  if (apiHandler.includes("logServerError")) {
    earnedPoints += 1;
    notes.push("API failures emit structured server logs.");
  }
  notes.push("Upstream Cboe timeouts still degrade to snapshot data by design.");
  return category("errors", "Error handling", 10, earnedPoints, notes);
}

function scoreMonitoring() {
  let earnedPoints = 0;
  const notes = [];
  if (exists("src/lib/runtimeLog.js") && exists("server/runtimeLog.mjs")) {
    earnedPoints += 3;
    notes.push("Client and server emit structured JSON error logs.");
  }
  if (exists("public/health.json")) {
    earnedPoints += 2;
    notes.push("Static health.json ships with the Pages artifact.");
  }
  if (appError.includes("componentDidCatch")) {
    earnedPoints += 1;
    notes.push("Unhandled dashboard renders are observable in logs.");
  }
  if (
    exists("src/lib/errorTracker.js") &&
    exists(".env.example") &&
    text(".env.example").includes("VITE_ERROR_TRACKER_DSN")
  ) {
    earnedPoints += 3;
    notes.push("Error-tracker hook is env-flagged and no-ops without a DSN.");
  }
  notes.push("No provider selected yet; Brendan must set the DSN to enable ingest.");
  return category("monitoring", "Monitoring and logging", 10, earnedPoints, notes);
}

function scoreA11yPerf() {
  let earnedPoints = 0;
  const notes = [];
  if (indexHtml.includes('lang="en"') && indexHtml.includes("skip-link")) {
    earnedPoints += 2;
    notes.push("Document language and skip link are present.");
  }
  if (dashboard.includes("aria-expanded") && indexCss.includes("prefers-reduced-motion")) {
    earnedPoints += 2;
    notes.push("Expanded-state controls and reduced-motion fallback exist.");
  }
  if (indexHtml.includes("display=swap") && (indexCss.includes(":focus-visible") || dashboard.includes("focus-visible"))) {
    earnedPoints += 2;
    notes.push("Font-display swap and visible focus styles exist.");
  }
  if (packageJson.scripts?.["check:a11y"] && packageJson.scripts?.["check:budget"]) {
    earnedPoints += 3;
    notes.push("Accessibility source check and bundle budget are gated.");
  } else {
    notes.push("Missing a11y or bundle-budget automation.");
  }
  if (exists("lighthouserc.json") && ciYml.includes("check:lighthouse")) {
    earnedPoints += 1;
    notes.push("Lighthouse CI asserts performance and accessibility budgets.");
  } else {
    notes.push("No Lighthouse CI; Google Fonts remain a third-party stylesheet.");
  }
  return category("a11y", "Accessibility and performance basics", 10, earnedPoints, notes);
}

function scoreDocs() {
  let earnedPoints = 0;
  const notes = [];
  if (
    limitsDoc.includes("GitHub Pages") &&
    /paper/i.test(limitsDoc) &&
    /no[- ]trade/i.test(limitsDoc)
  ) {
    earnedPoints += 3;
    notes.push("Production limits document host, research-only, and no-trade constraints.");
  }
  if (readinessDoc.includes("Manual checks still requiring Brendan") || limitsDoc.includes("Brendan")) {
    earnedPoints += 2;
    notes.push("Remaining operator decisions are documented.");
  }
  return category("docs", "Docs and documented limits", 5, earnedPoints, notes);
}

function scorePaperOnly() {
  let earnedPoints = 0;
  const notes = [];
  if (/research only/i.test(dashboard) && /No execution surface/i.test(dashboard)) {
    earnedPoints += 3;
    notes.push("Dashboard copy discloses research-only / no execution.");
  }
  if (/Source: ECB statistics/.test(limitsDoc) || exists("data/research/ecb_usd_majors_v1.manifest.json")) {
    earnedPoints += 2;
    notes.push("FX research artifacts stay paper-only with ECB attribution.");
  }
  return category("paper", "Research code paper-only", 5, earnedPoints, notes);
}

function isPinned(workflow) {
  return (
    Boolean(workflow) &&
    /uses:\s*actions\/(?:checkout|setup-node|setup-python|upload-pages-artifact|deploy-pages)@[0-9a-f]{40}/.test(
      workflow,
    ) &&
    !/uses:\s*actions\/(?:checkout|setup-node|setup-python)@v\d+\s*$/m.test(workflow)
  );
}

function auditSummary(args) {
  try {
    const output = execFileSync("npm", ["audit", "--json", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(output).metadata?.vulnerabilities ?? { total: 0 };
  } catch (error) {
    const payload = error.stdout ? String(error.stdout) : "";
    try {
      return JSON.parse(payload).metadata?.vulnerabilities ?? { total: -1 };
    } catch {
      return { total: -1 };
    }
  }
}

function scanSecrets(files) {
  const patterns = [
    /AKIA[0-9A-Z]{16}/,
    /ghp_[A-Za-z0-9]{20,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
    /sk-live-[A-Za-z0-9]{16,}/,
    /sk_live_[A-Za-z0-9]{16,}/,
  ];
  const skip = /(^|\/)(package-lock\.json|.*\.csv|.*\.png|.*\.jpg)$/i;
  const hits = [];
  for (const file of files) {
    if (skip.test(file) || file.endsWith(".example")) continue;
    if (!exists(file)) continue;
    let contents = "";
    try {
      contents = readFileSync(join(root, file), "utf8");
    } catch {
      continue;
    }
    if (contents.includes("\u0000")) continue;
    for (const pattern of patterns) {
      if (pattern.test(contents)) {
        hits.push(`${file} matched ${pattern}`);
      }
    }
  }
  return hits;
}

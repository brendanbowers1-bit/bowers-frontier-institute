import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const failures = [];
const fail = (message) => failures.push(message);

const health = JSON.parse(await readFile("public/health.json", "utf8"));
const registry = JSON.parse(await readFile("data/research/falsification.json", "utf8"));

if (health.status !== "ok") {
  fail("health.json status must be ok.");
}
if (health.researchOnly !== true || health.noTradeExecution !== true || health.noLiveOrders !== true) {
  fail("health.json must stay research-only with no trade execution or live orders.");
}
if (health.noLiveFetchAtRuntime !== true) {
  fail("health.json must declare no live fetch at runtime.");
}
if (health.errorTrackerDsnConfigured !== false) {
  fail("health.json must not claim a DSN is configured.");
}
if (health.checks?.staticArtifact !== true || health.checks?.falsificationRegistry !== true) {
  fail("health.json must report static artifact and falsification-registry checks.");
}
if (health.registry?.route !== "/research/falsification.json" || health.registry?.page !== "/falsification.html") {
  fail("health.json must point at the public falsification page and JSON route.");
}

const expectedCounts = registry.statusCounts;
const actualCounts = { FALSIFIED: 0, "FAIL-N": 0, UNSCORED: 0, PASS: 0 };
for (const item of registry.hypotheses ?? []) {
  actualCounts[item.displayStatus] += 1;
}
if (health.registry?.hypothesisCount !== registry.hypotheses.length) {
  fail("health.json hypothesisCount must match the falsification registry.");
}
for (const status of Object.keys(actualCounts)) {
  if (health.registry?.statusCounts?.[status] !== actualCounts[status]) {
    fail(`health.json statusCounts.${status} does not match the registry.`);
  }
  if (expectedCounts[status] !== actualCounts[status]) {
    fail(`falsification.json statusCounts.${status} does not match rows.`);
  }
}

if (existsSync("dist/falsification.html") && existsSync("dist/health.json")) {
  const distHealth = JSON.parse(await readFile("dist/health.json", "utf8"));
  if (JSON.stringify(distHealth) !== JSON.stringify(health)) {
    fail("dist/health.json must match public/health.json after a production build.");
  }
}

if (existsSync("dist/research/falsification.json")) {
  const distRegistry = JSON.parse(await readFile("dist/research/falsification.json", "utf8"));
  if (distRegistry.hypotheses?.length !== registry.hypotheses.length) {
    fail("dist/research/falsification.json must match the canonical registry length.");
  }
}

if (failures.length > 0) {
  console.error("Health check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Health check passed (DSN-free; ${registry.hypotheses.length} registry rows; ${JSON.stringify(actualCounts)}).`,
);

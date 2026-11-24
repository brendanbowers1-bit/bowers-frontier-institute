import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DISPLAY_STATUSES = ["FALSIFIED", "FAIL-N", "UNSCORED", "PASS"];
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vendorRoot = join(root, "vendor/labs");
const outPath = join(root, "data/research/falsification.json");
const healthPath = join(root, "public/health.json");
const check = process.argv.includes("--check");

const pin = JSON.parse(await readFile(join(vendorRoot, "PIN.json"), "utf8"));
const schema = JSON.parse(await readFile(join(root, "schemas/falsification-registry.schema.json"), "utf8"));
assertPin(pin);

const arb = await readJson("bfi-arbitrage/research/falsification/registry.v1.json");
const finance = await readJson("bfi-finance-lab/research/falsification/registry.json");

if (arb.version !== "v1" || arb.paper_only !== true || arb.live_orders !== false) {
  throw new Error("Arb registry.v1.json must be paper-only v1 with live_orders false.");
}
if (finance.paper_only !== true || finance.live_orders !== false || finance.schema_version !== 1) {
  throw new Error("Finance registry.json must be paper-only schema_version 1 with live_orders false.");
}

const hypotheses = [...arb.hypotheses.map(fromArb), ...finance.hypotheses.map(fromFinance)];
const ids = new Set();
for (const item of hypotheses) {
  if (ids.has(item.id)) {
    throw new Error(`Duplicate falsification id ${item.id}.`);
  }
  ids.add(item.id);
}

const statusCounts = Object.fromEntries(DISPLAY_STATUSES.map((status) => [status, 0]));
for (const item of hypotheses) {
  statusCounts[item.displayStatus] += 1;
}

const registry = {
  schemaVersion: "1.0.0",
  paperResearchOnly: true,
  noTradeExecution: true,
  noLiveOrders: true,
  noRealFunds: true,
  noExchangeApiKeys: true,
  noTradingSignals: true,
  noLiveFetchAtRuntime: true,
  notATradingEdge: true,
  updated: "2026-11-24",
  pin,
  disclaimer:
    "Pinned falsification book from Arb registry.v1.json and the finance lab registry. Statuses are FALSIFIED, FAIL-N (n below the frozen n_target), UNSCORED, or PASS. PASS is a pre-registered statistical gate only. Not a trading edge. Nothing here is a live order, fund transfer, or advice.",
  statusCounts,
  hypotheses,
};

validateRegistry(registry, schema);

const health = {
  status: "ok",
  service: "br3n-web",
  mode: "static",
  researchOnly: true,
  noTradeExecution: true,
  noLiveOrders: true,
  noLiveFetchAtRuntime: true,
  errorTrackerDsnConfigured: false,
  updated: registry.updated,
  checks: {
    staticArtifact: true,
    falsificationRegistry: true,
    paperOnly: true,
  },
  registry: {
    route: "/research/falsification.json",
    page: "/falsification.html",
    hypothesisCount: hypotheses.length,
    statusCounts,
  },
};

const serialized = `${JSON.stringify(registry, null, 2)}\n`;
const healthSerialized = `${JSON.stringify(health, null, 2)}\n`;

if (check) {
  const existing = await readFile(outPath, "utf8");
  const existingHealth = await readFile(healthPath, "utf8");
  if (existing !== serialized) {
    throw new Error("data/research/falsification.json is out of date. Run: node scripts/build-falsification-registry.mjs");
  }
  if (existingHealth !== healthSerialized) {
    throw new Error("public/health.json is out of date. Run: node scripts/build-falsification-registry.mjs");
  }
  console.log(
    `Falsification registry check passed (${hypotheses.length} hypotheses: ${formatCounts(statusCounts)}).`,
  );
} else {
  await writeFile(outPath, serialized);
  await writeFile(healthPath, healthSerialized);
  console.log(`Wrote ${outPath} (${hypotheses.length} hypotheses: ${formatCounts(statusCounts)}).`);
  console.log(`Wrote ${healthPath} (DSN-free registry health).`);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(vendorRoot, relativePath), "utf8"));
}

function fromArb(item) {
  const displayStatus = displayStatusFromSample(item.verdict, item.n, item.n_target);
  const holdout = formatHoldout(item.holdout);
  const metrics = [
    {
      label: "Effect",
      value: formatEffect(item.effect, item.effect_unit),
      detail: item.effect_unit ?? "",
    },
    {
      label: "n / n_target",
      value: formatSample(item.n, item.n_target),
      detail: displayStatus === "FAIL-N" ? "below frozen n_target" : "frozen sample gate",
    },
    {
      label: "95% CI",
      value: formatCi(item.ci, item.effect_unit),
      detail: item.mde == null ? "no MDE" : `MDE ${formatNumber(item.mde)}`,
    },
  ];
  return {
    id: item.id,
    title: item.name,
    lab: "bfi-arbitrage",
    prUrl: item.pr_url ?? null,
    prLabel: item.pr ? `bfi-arbitrage#${item.pr}` : null,
    displayStatus,
    labVerdict: item.verdict,
    hypothesis: item.name,
    holdout,
    n: item.n,
    nTarget: item.n_target,
    registrationHash: item.freeze_hash ? `sha256:${item.freeze_hash}` : null,
    metrics,
    verdict: arbVerdictCopy(item, displayStatus),
    note: item.holdout?.note ?? "",
  };
}

function fromFinance(item) {
  const result = item.result ?? {};
  const displayStatus = displayStatusFromSample(result.verdict, result.n, item.n_target ?? null);
  const metrics = [
    {
      label: "Effect",
      value: formatEffect(result.effect, result.effect_unit),
      detail: result.effect_unit ?? "",
    },
    {
      label: "n",
      value: result.n == null ? "—" : Number(result.n).toLocaleString("en-US"),
      detail: "Source: ECB statistics",
    },
    {
      label: "Registration",
      value: item.registration ?? "unspecified",
      detail: item.spec_hash ? `sha256:${item.spec_hash.slice(0, 12)}…` : "no spec hash",
    },
  ];
  return {
    id: item.id,
    title: item.title,
    lab: "bfi-finance-lab",
    prUrl: item.pr ? `https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/${item.pr}` : null,
    prLabel: item.pr ? `bfi-finance-lab#${item.pr}` : null,
    displayStatus,
    labVerdict: result.verdict,
    hypothesis: item.hypothesis,
    holdout: "Development origins 1–108; origin 109 frozen. Source: ECB statistics.",
    n: result.n ?? null,
    nTarget: item.n_target ?? null,
    registrationHash: item.spec_hash ? `sha256:${item.spec_hash}` : null,
    metrics,
    verdict: financeVerdictCopy(item, displayStatus),
    note: result.note ?? "",
  };
}

function displayStatusFromSample(verdict, n, nTarget) {
  if (verdict === "UNSCORED") {
    return "UNSCORED";
  }
  if (n != null && nTarget != null && n < nTarget) {
    return "FAIL-N";
  }
  if (DISPLAY_STATUSES.includes(verdict)) {
    return verdict;
  }
  throw new Error(`Unsupported lab verdict ${verdict}.`);
}

function arbVerdictCopy(item, displayStatus) {
  if (displayStatus === "FAIL-N") {
    return `FAIL-N. n=${item.n} missed the frozen n_target=${item.n_target}. Lab verdict ${item.verdict} is not promoted. Not a trading edge.`;
  }
  if (displayStatus === "UNSCORED") {
    return "UNSCORED. No holdout score has been published yet. Not a trading edge.";
  }
  if (displayStatus === "PASS") {
    return "PASS of a pre-registered statistical gate only. Evidence advancement is not a trading edge.";
  }
  return `FALSIFIED. Holdout did not clear the frozen gates. Effect ${formatEffect(item.effect, item.effect_unit)}. Not a trading edge.`;
}

function financeVerdictCopy(item, displayStatus) {
  const note = item.result?.note ? ` ${item.result.note}` : "";
  if (displayStatus === "PASS") {
    return `PASS of pre-registered MCS-inclusion gates only.${note} Evidence advancement denied. Not a trading edge.`;
  }
  if (displayStatus === "UNSCORED") {
    return "UNSCORED. No holdout score has been published yet. Not a trading edge.";
  }
  if (displayStatus === "FAIL-N") {
    return `FAIL-N. Sample is below the frozen n_target.${note} Not a trading edge.`;
  }
  return `FALSIFIED.${note} Not a trading edge.`;
}

function formatHoldout(holdout) {
  if (!holdout) {
    return "No holdout window published.";
  }
  const start = holdout.start ?? "unspecified";
  const end = holdout.end ?? "unspecified";
  const note = holdout.note ? `; ${holdout.note}` : "";
  return `${start} → ${end} (${holdout.timezone ?? "UTC"})${note}`;
}

function formatSample(n, nTarget) {
  if (n == null && nTarget == null) {
    return "—";
  }
  if (n == null) {
    return `— / ${nTarget}`;
  }
  if (nTarget == null) {
    return Number(n).toLocaleString("en-US");
  }
  return `${Number(n).toLocaleString("en-US")} / ${Number(nTarget).toLocaleString("en-US")}`;
}

function formatEffect(effect, unit) {
  if (effect == null) {
    return "—";
  }
  if (typeof effect === "boolean") {
    return effect ? "true" : "false";
  }
  if (unit === "usd_per_100_contracts") {
    const sign = effect < 0 ? "−" : "";
    return `${sign}$${Math.abs(effect).toFixed(2)} / 100 contracts`;
  }
  if (unit === "bps_of_notional") {
    const sign = effect < 0 ? "−" : "";
    return `${sign}${Math.abs(effect).toFixed(2)} bps`;
  }
  if (typeof effect === "number") {
    return formatNumber(effect);
  }
  return String(effect);
}

function formatCi(ci, unit) {
  if (!Array.isArray(ci) || ci.length !== 2 || ci[0] == null || ci[1] == null) {
    return "—";
  }
  return `[${formatEffect(ci[0], unit)}, ${formatEffect(ci[1], unit)}]`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const abs = Math.abs(value);
  const digits = abs >= 1 ? 4 : 8;
  const sign = value < 0 ? "−" : "";
  return `${sign}${abs.toFixed(digits)}`;
}

function formatCounts(counts) {
  return DISPLAY_STATUSES.map((status) => `${status} ${counts[status]}`).join(", ");
}

function assertPin(doc) {
  if (!doc.noLiveFetchAtRuntime || !doc.paperResearchOnly) {
    throw new Error("PIN.json must forbid live fetch and stay paper-only.");
  }
  const labs = new Set((doc.sources ?? []).map((source) => source.lab));
  if (!labs.has("bfi-arbitrage") || !labs.has("bfi-finance-lab")) {
    throw new Error("PIN.json must name pinned arb and finance lab SHAs.");
  }
}

function validateRegistry(doc, schemaDoc) {
  for (const key of schemaDoc.required) {
    if (!(key in doc)) {
      throw new Error(`Falsification registry is missing required schema field ${key}.`);
    }
  }
  for (const [key, spec] of Object.entries(schemaDoc.properties)) {
    if (spec.const !== undefined && doc[key] !== spec.const) {
      throw new Error(`Falsification registry ${key} must equal ${spec.const}.`);
    }
  }
  if (!doc.paperResearchOnly || !doc.noLiveFetchAtRuntime || !doc.notATradingEdge) {
    throw new Error("Canonical falsification registry must stay paper-only with no live fetch.");
  }
  if (!Array.isArray(doc.hypotheses) || doc.hypotheses.length < 14) {
    throw new Error("Canonical falsification registry must include Arb v1 plus finance hypotheses.");
  }
  const required = schemaDoc.properties.hypotheses.items.required;
  const counts = { FALSIFIED: 0, "FAIL-N": 0, UNSCORED: 0, PASS: 0 };
  for (const item of doc.hypotheses) {
    for (const key of required) {
      if (item[key] == null || item[key] === "") {
        throw new Error(`Hypothesis ${item.id ?? "?"} is missing ${key}.`);
      }
    }
    if (!DISPLAY_STATUSES.includes(item.displayStatus)) {
      throw new Error(`Hypothesis ${item.id} has invalid displayStatus.`);
    }
    counts[item.displayStatus] += 1;
    if (/trading edge/i.test(item.verdict) && !/not a trading edge/i.test(item.verdict)) {
      throw new Error(`Hypothesis ${item.id} must not claim a trading edge.`);
    }
  }
  for (const status of DISPLAY_STATUSES) {
    if (doc.statusCounts[status] !== counts[status]) {
      throw new Error(`statusCounts.${status} does not match hypothesis rows.`);
    }
  }
  if (counts["FAIL-N"] < 1 || counts.UNSCORED < 2 || counts.PASS < 1 || counts.FALSIFIED < 10) {
    throw new Error("Expected at least FALSIFIED 10, FAIL-N 1, UNSCORED 2, PASS 1.");
  }
}

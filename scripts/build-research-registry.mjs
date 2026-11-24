import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vendorRoot = join(root, "vendor/labs");
const outPath = join(root, "data/research/hypotheses.json");
const check = process.argv.includes("--check");

const pin = JSON.parse(await readFile(join(vendorRoot, "PIN.json"), "utf8"));
const schema = JSON.parse(await readFile(join(root, "schemas/research-hypotheses.schema.json"), "utf8"));
assertPin(pin);

const makerSpec = await readJson("bfi-arbitrage/pm_maker/frozen_spec.json");
const makerSnap = await readJson("bfi-arbitrage/pm_maker/snapshot.summary.json");
const calibSpec = await readJson("bfi-arbitrage/pm_calib/frozen_spec.json");
const calibSnap = await readJson("bfi-arbitrage/pm_calib/snapshot.summary.json");
const leadSpec = await readJson("bfi-arbitrage/pm_leadlag/frozen_spec.json");
const leadSnap = await readJson("bfi-arbitrage/pm_leadlag/snapshot.summary.json");
const fxRv = await readJson("bfi-finance-lab/fx_realized_vol_wf.json");
const fxRev = await readJson("bfi-finance-lab/fx_reversal_calendar_wf.json");
const ecb = await readJson("bowers-frontier-institute/ecb_usd_major_walk_forward.json");

for (const doc of [makerSpec, makerSnap, calibSpec, calibSnap, leadSpec, leadSnap]) {
  assertPaper(doc);
}
for (const doc of [fxRv, fxRev]) {
  if (doc.quality_gate?.trading_signal_allowed !== false || doc.metadata?.mode !== "research_only") {
    throw new Error("Finance registry file is not marked research-only.");
  }
}
if (makerSnap.n_holdout !== 327) {
  throw new Error(`Maker snapshot n_holdout must be 327, got ${makerSnap.n_holdout}.`);
}
if (Math.round(makerSnap.holdout.holdout_mean_net_bps) !== -111) {
  throw new Error("Maker snapshot mean EV must round to −111 bps.");
}
if (fxRv.quality_gate?.robust_finding_supported !== false || fxRv.run_summary?.robust_finding_supported !== false) {
  throw new Error("FX realized-vol registry must remain a non-robust finding.");
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
  updated: "2026-11-24",
  pin,
  disclaimer:
    "Pre-registered lab hypotheses and holdout verdicts from pinned vendored registry files. Falsified results stay published. Nothing here is a live order, a trading signal, or advice.",
  hypotheses: [
    hypothesis({
      id: "kalshi-maker-spread",
      title: "Kalshi maker spread capture",
      lab: "bfi-arbitrage",
      prUrl: "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/16",
      prLabel: "bfi-arbitrage#16",
      status: "falsified",
      hypothesis: makerSpec.hypothesis,
      holdout: "15-minute windows ending in [2026-10-01, 2026-11-10) UTC; second holdout sealed",
      n: makerSnap.n_holdout,
      registrationHash: `sha256:${makerSnap.spec_hash}`,
      metrics: [
        {
          label: "Mean after-fee EV",
          value: signedBps(makerSnap.holdout.holdout_mean_net_bps),
          detail: `${signedUsd(makerSnap.holdout.holdout_mean_net_usd)} / 100 contracts`,
        },
        {
          label: "Bootstrap 95% CI",
          value: `[${signedUsd(makerSnap.holdout.holdout_mean_net_usd_ci_low)}, ${signedUsd(makerSnap.holdout.holdout_mean_net_usd_ci_high)}]`,
          detail: "primary CI lo < 0",
        },
        {
          label: "Two-sided locks",
          value: pct(makerSnap.holdout.holdout_two_sided_share),
          detail: `one-sided pickoffs ${pct(makerSnap.holdout.holdout_one_sided_share, 1)}`,
        },
      ],
      verdict:
        "FALSIFIED. n=327 missed the frozen 400 gate. Mean after-fee EV −111 bps. Second holdout was not opened. Do not promote.",
    }),
    hypothesis({
      id: "fx-realized-vol",
      title: "FX realized-vol walk-forward",
      lab: "bfi-finance-lab",
      prUrl: "https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/10",
      prLabel: "bfi-finance-lab#10",
      status: "falsified",
      hypothesis:
        "HAR-RV has lower QLIKE than GARCH(1,1), EWMA λ=0.94, and naive last RV on a leakage-safe ECB daily realized-variance walk-forward, with a robust pair-level Model Confidence Set.",
      holdout: "Pooled outer-fold n=40,824; origin 109 of each pair remained closed",
      n: fxRv.run_summary.pooled_n_obs,
      registrationHash: null,
      metrics: [
        { label: "HAR-RV QLIKE", value: String(fxRv.run_summary.pooled_har_rv_qlike), detail: "primary candidate" },
        { label: "EWMA QLIKE", value: String(fxRv.run_summary.pooled_ewma_qlike), detail: "only model in pair-count MCS" },
        { label: "Naive last RV QLIKE", value: String(fxRv.run_summary.pooled_naive_qlike), detail: "Source: ECB statistics" },
      ],
      verdict:
        "FALSIFIED as a robust finding. Pair-count QLIKE MCS (α=0.10) includes EWMA only. HAR-RV’s pooled lead is a EURCHF composition effect. No robust winner. Not a trading signal.",
    }),
    hypothesis({
      id: "fade-the-favorite",
      title: "Fade-the-favorite calibration",
      lab: "bfi-arbitrage",
      prUrl: "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/10",
      prLabel: "bfi-arbitrage#10",
      status: "falsified",
      hypothesis: calibSpec.hypothesis,
      holdout: "Settled binaries with close_time in [2026-09-01, 2026-11-24) UTC",
      n: calibSnap.n_holdout,
      registrationHash: `sha256:${calibSnap.spec_hash}`,
      metrics: [
        { label: "Mean after-fee EV", value: "−706 bps", detail: "−$7.06 / 100 contracts" },
        { label: "ECE", value: "0.089", detail: "exceeds 0.03 miscalibration gate" },
        { label: "Bootstrap 95% CI", value: "entirely below zero", detail: "do not promote" },
      ],
      verdict: "FALSIFIED. Miscalibration exists, but fade-the-favorite loses after fees. Do not promote.",
    }),
    hypothesis({
      id: "pm-spot-lead-lag",
      title: "Polymarket → BTC spot lead/lag",
      lab: "bfi-arbitrage",
      prUrl: "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/13",
      prLabel: "bfi-arbitrage#13",
      status: "falsified",
      hypothesis: leadSpec.hypothesis,
      holdout: "Polymarket BTC 15m windows ending in [2026-10-01, 2026-11-24) UTC",
      n: leadSnap.n_holdout,
      registrationHash: `sha256:${leadSnap.spec_hash}`,
      metrics: [
        { label: "Mean after-fee EV", value: "−20.01 bps", detail: "bootstrap 95% CI [−20.88, −19.16]" },
        { label: "Gross mean", value: "−0.01 bps", detail: "before taker fees" },
        { label: "Walk-forward halves", value: "both lose", detail: "do not revive fade-the-favorite" },
      ],
      verdict: "FALSIFIED. Prediction-market lead/lag does not beat costs on this holdout. Do not promote.",
    }),
    hypothesis({
      id: "fx-reversal-vs-random-walk",
      title: "5-day FX reversal vs random walk",
      lab: "bfi-finance-lab",
      prUrl: "https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/9",
      prLabel: "bfi-finance-lab#9",
      status: "falsified",
      hypothesis:
        "A 5-day reversal of trailing ECB close returns (with a turn-of-month overlay) has lower after-cost MAE than a zero random walk on frozen-holdout FX majors.",
      holdout: "Pooled outer-fold n=40,824; origin 109 of each pair remained closed",
      n: fxRev.run_summary.pooled_n_obs,
      registrationHash: null,
      metrics: [
        {
          label: "5-day reversal cost-adj MAE",
          value: String(fxRev.run_summary.pooled_reversal_5d_cost_adjusted_mae),
          detail: "1 bp charge",
        },
        {
          label: "Random walk MAE",
          value: String(fxRev.run_summary.pooled_random_walk_mae),
          detail: "lower is better",
        },
        {
          label: "Turn-of-month cost-adj MAE",
          value: String(fxRev.run_summary.pooled_turn_of_month_cost_adjusted_mae),
          detail: "still worse than random walk",
        },
      ],
      verdict:
        "FALSIFIED. After a 1 bp charge, every candidate is worse than random walk on every pair. Not a trading signal.",
    }),
    hypothesis({
      id: "ecb-usd-major-walk-forward",
      title: "ECB USD-major next-day return walk-forward",
      lab: "bowers-frontier-institute",
      prUrl: "https://github.com/brendanbowers1-bit/bowers-frontier-institute/pull/6",
      prLabel: "bowers-frontier-institute#6",
      status: "falsified",
      hypothesis:
        "A leakage-safe expanding-window RandomForest on ECB-derived USD majors forecasts next-day returns with usable directional skill.",
      holdout: "Frozen last 2 years 2024-11-04 to 2026-11-03; OOS 2002-02-01 to 2024-11-01",
      n: ecb.run_summary.pooled_n_obs,
      registrationHash: null,
      metrics: [
        { label: "Walk-forward OOS direction", value: "50.2%", detail: "MAE 0.00477, R² −0.05, 40,796 rows" },
        { label: "Frozen holdout direction", value: "48.8%", detail: "MAE 0.00368, R² −0.05, 3,570 rows" },
        { label: "Pairs / window", value: "7 pairs, 1999–2026", detail: "Source: ECB statistics" },
      ],
      verdict:
        "FALSIFIED as a directional edge. Near-50% direction and negative R² mean this baseline has no usable daily skill. Paper/research only; not P&L.",
    }),
  ],
};

validateRegistry(registry, schema);

const serialized = `${JSON.stringify(registry, null, 2)}\n`;
if (check) {
  const existing = await readFile(outPath, "utf8");
  if (existing !== serialized) {
    throw new Error("data/research/hypotheses.json is out of date. Run: node scripts/build-research-registry.mjs");
  }
  console.log(`Research registry check passed (${registry.hypotheses.length} hypotheses).`);
} else {
  await writeFile(outPath, serialized);
  console.log(`Wrote ${outPath} (${registry.hypotheses.length} hypotheses).`);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(vendorRoot, relativePath), "utf8"));
}

function hypothesis(fields) {
  return fields;
}

function assertPin(doc) {
  if (!doc.noLiveFetchAtRuntime || !doc.paperResearchOnly) {
    throw new Error("PIN.json must forbid live fetch and stay paper-only.");
  }
  if (!Array.isArray(doc.sources) || doc.sources.length < 2) {
    throw new Error("PIN.json must name pinned arb and finance lab SHAs.");
  }
}

function assertPaper(doc) {
  if (doc.paper_only !== true || doc.live_orders !== false) {
    throw new Error("Arb registry file must be paper-only with live_orders false.");
  }
}

function signedUsd(n) {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function signedBps(n) {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded)} bps`;
}

function pct(n, digits = 2) {
  return `${(n * 100).toFixed(digits)}%`;
}

function validateRegistry(doc, schemaDoc) {
  for (const key of schemaDoc.required) {
    if (!(key in doc)) {
      throw new Error(`Registry is missing required schema field ${key}.`);
    }
  }
  for (const [key, spec] of Object.entries(schemaDoc.properties)) {
    if (spec.const !== undefined && doc[key] !== spec.const) {
      throw new Error(`Registry ${key} must equal ${spec.const}.`);
    }
  }
  const required = schemaDoc.properties.hypotheses.items.required;
  if (!doc.paperResearchOnly || !doc.noLiveFetchAtRuntime) {
    throw new Error("Canonical registry must be paper-only with no live fetch.");
  }
  if (!Array.isArray(doc.hypotheses) || doc.hypotheses.length < 6) {
    throw new Error("Canonical registry must include the six published holdouts.");
  }
  const ids = new Set();
  for (const item of doc.hypotheses) {
    for (const key of required) {
      if (item[key] == null || item[key] === "") {
        throw new Error(`Hypothesis ${item.id ?? "?"} is missing ${key}.`);
      }
    }
    if (!["falsified", "open"].includes(item.status)) {
      throw new Error(`Hypothesis ${item.id} has invalid status.`);
    }
    if (!Number.isFinite(item.n) || item.n <= 0) {
      throw new Error(`Hypothesis ${item.id} has invalid n.`);
    }
    if (!Array.isArray(item.metrics) || item.metrics.length < 1) {
      throw new Error(`Hypothesis ${item.id} has no metrics.`);
    }
    if (ids.has(item.id)) {
      throw new Error(`Duplicate hypothesis id ${item.id}.`);
    }
    ids.add(item.id);
  }
  if (!ids.has("kalshi-maker-spread") || !ids.has("fx-realized-vol")) {
    throw new Error("Canonical registry is missing the latest maker-spread or FX RV holdout.");
  }
}

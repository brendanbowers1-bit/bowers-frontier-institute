import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { scanCreditCollars } from "../server/creditCollarScanner.mjs";
import {
  collarOptimizationProfiles,
  creditCollarCandidates,
  optimizeCreditCollars,
} from "../src/data/creditCollars.js";

const DEFAULT_SYMBOLS = ["QQQ", "SPY", "NVDA", "MSFT", "GOOGL", "META", "AMZN", "AVGO", "AMD", "PLTR", "TSLA"];
const args = parseArgs(process.argv.slice(2));
const loop = args.loop || Number(process.env.COLLAR_LOOP_ITERATIONS ?? "1") === 0;
const iterations = loop ? Number(process.env.COLLAR_LOOP_ITERATIONS ?? "0") : Number(args.iterations ?? process.env.COLLAR_LOOP_ITERATIONS ?? "1");
const intervalMs = Number(args.intervalMs ?? process.env.COLLAR_LOOP_INTERVAL_MS ?? "45000");
const outputDir = args.outputDir ?? process.env.COLLAR_LOOP_OUTPUT_DIR ?? "docs";
const symbols = normalizeSymbols(args.symbols ?? process.env.COLLAR_LOOP_SYMBOLS ?? DEFAULT_SYMBOLS.join(","));
const minimumQuality = Number(args.minimumQuality ?? process.env.COLLAR_MIN_QUALITY ?? "78");

if (iterations < 0 || !Number.isFinite(iterations)) {
  throw new Error("Iterations must be a non-negative number. Use 0 for continuous mode.");
}

if (intervalMs < 5000 || !Number.isFinite(intervalMs)) {
  throw new Error("Interval must be at least 5000ms to avoid hammering market-data endpoints.");
}

await mkdir(outputDir, { recursive: true });

let completed = 0;
let keepRunning = true;

process.on("SIGINT", () => {
  keepRunning = false;
  console.log("\nStopping credit collar quality loop after current iteration.");
});

process.on("SIGTERM", () => {
  keepRunning = false;
  console.log("\nStopping credit collar quality loop after current iteration.");
});

do {
  completed += 1;
  const startedAt = new Date();
  const previous = await readPreviousSnapshot(outputDir);
  const snapshot = await runQualityPass({ minimumQuality, previous, startedAt, symbols });
  await writeOutputs(snapshot, outputDir);

  console.log(
    [
      `Credit collar quality loop ${completed}${iterations > 0 ? `/${iterations}` : ""}`,
      `status=${snapshot.status}`,
      `profile=${snapshot.activeProfile.label}`,
      `quality=${snapshot.qualityScore}`,
      `accepted=${snapshot.accepted.length}`,
      `rejected=${snapshot.rejected.length}`,
      `source=${snapshot.source}`,
    ].join(" | "),
  );

  if (!keepRunning || (iterations > 0 && completed >= iterations)) break;
  await sleep(intervalMs);
} while (keepRunning);

async function runQualityPass({ minimumQuality, previous, startedAt, symbols }) {
  const scan = await scanCreditCollars({ symbols, maxPerSymbol: 5 });
  const sourceCandidates = scan.candidates?.length ? scan.candidates : creditCollarCandidates;
  const profileRuns = collarOptimizationProfiles.map((profile) =>
    evaluateProfile(profile, sourceCandidates, previous),
  );
  profileRuns.sort((a, b) => b.qualityScore - a.qualityScore || b.accepted.length - a.accepted.length);

  const best = profileRuns[0];
  const top = best.accepted[0] ?? best.ranked[0];
  const status = best.qualityScore >= minimumQuality && best.accepted.length > 0 ? "PASS" : "REVIEW";

  return {
    generatedAt: startedAt.toISOString(),
    symbols,
    source: scan.source,
    degraded: scan.degraded,
    minimumQuality,
    status,
    qualityScore: best.qualityScore,
    activeProfile: {
      id: best.profile.id,
      label: best.profile.label,
      description: best.profile.description,
    },
    topCandidate: top ? summarizeCandidate(top) : null,
    accepted: best.accepted.map(summarizeCandidate),
    rejected: best.rejected.map((item) => ({
      ...summarizeCandidate(item.candidate),
      rejectionReasons: item.reasons,
    })),
    profileRuns: profileRuns.map((run) => ({
      profile: run.profile.label,
      qualityScore: run.qualityScore,
      accepted: run.accepted.length,
      rejected: run.rejected.length,
      averageScore: run.averageScore,
      averageCreditPct: run.averageCreditPct,
      averageFloorDrawdownPct: run.averageFloorDrawdownPct,
      averageLiquidity: run.averageLiquidity,
    })),
    improvementNotes: buildImprovementNotes(best, previous),
    guardrails: [
      "No order routing or trade execution is performed.",
      "Reject candidates with non-positive credit, weak liquidity, excessive floor drawdown, or too little upside room.",
      "Validate live quotes, tax impact, assignment risk, and portfolio fit before acting.",
    ],
  };
}

function evaluateProfile(profile, candidates, previous) {
  const ranked = optimizeCreditCollars(candidates, profile.id);
  const accepted = [];
  const rejected = [];

  for (const candidate of ranked) {
    const reasons = rejectionReasons(candidate);
    if (reasons.length === 0) {
      accepted.push(candidate);
    } else {
      rejected.push({ candidate, reasons });
    }
  }

  const leading = accepted.slice(0, 8);
  const averageScore = average(leading.map((candidate) => candidate.score));
  const averageCreditPct = average(leading.map((candidate) => candidate.netCreditPct));
  const averageFloorDrawdownPct = average(leading.map((candidate) => candidate.floorDrawdownPct));
  const averageLiquidity = average(leading.map((candidate) => candidate.liquidityScore));
  const concentrationPenalty = concentrationRisk(leading);
  const stabilityBonus = rankStabilityBonus(leading, previous);
  const qualityScore = Math.round(
    clamp(
      averageScore * 0.5 +
        averageLiquidity * 0.18 +
        clamp((2.2 - averageFloorDrawdownPct / 6) * 18, 0, 18) +
        clamp(averageCreditPct * 4, 0, 10) +
        stabilityBonus -
        concentrationPenalty,
      0,
      100,
    ),
  );

  return {
    profile,
    ranked,
    accepted,
    rejected,
    averageScore: round(averageScore, 1),
    averageCreditPct: round(averageCreditPct, 2),
    averageFloorDrawdownPct: round(averageFloorDrawdownPct, 1),
    averageLiquidity: round(averageLiquidity, 1),
    qualityScore,
  };
}

function rejectionReasons(candidate) {
  const reasons = [];

  if (candidate.netCredit <= 0) reasons.push("not-positive-credit");
  if (candidate.score < 72) reasons.push("optimizer-score-below-watchlist");
  if (candidate.floorDrawdownPct > 12) reasons.push("protected-floor-too-far-away");
  if (candidate.upsideToCallPct < 5) reasons.push("upside-room-too-tight");
  if (candidate.liquidityScore < 45) reasons.push("liquidity-score-too-low");
  if (Math.min(candidate.putOpenInterest, candidate.callOpenInterest) < 100) reasons.push("open-interest-too-thin");

  return reasons;
}

function summarizeCandidate(candidate) {
  return {
    symbol: candidate.symbol,
    name: candidate.name,
    score: candidate.score,
    scoreLabel: candidate.scoreLabel,
    spot: candidate.spot,
    expiration: candidate.expiration,
    dte: candidate.dte,
    buyPut: `${candidate.putStrike}P @ ${currency(candidate.putAsk)}`,
    sellCall: `${candidate.callStrike}C @ ${currency(candidate.callBid)}`,
    netCredit: currency(candidate.netCredit),
    netCreditPct: `${candidate.netCreditPct.toFixed(2)}%`,
    protectedFloor: currency(candidate.floorValue),
    floorDrawdownPct: `${candidate.floorDrawdownPct.toFixed(1)}%`,
    upsideToCallPct: `${candidate.upsideToCallPct.toFixed(1)}%`,
    maxUpsidePct: `${candidate.maxUpsidePct.toFixed(1)}%`,
    liquidityScore: candidate.liquidityScore,
    minOpenInterest: Math.min(candidate.putOpenInterest, candidate.callOpenInterest),
    tags: candidate.tags,
  };
}

function buildImprovementNotes(best, previous) {
  const notes = [];
  const top = best.accepted[0];

  if (!top) {
    notes.push("No candidate cleared all gates; keep the feed in review mode and wait for better credit/liquidity.");
  } else {
    notes.push(`${top.symbol} leads the current pass under ${best.profile.label} with score ${top.score}.`);
  }

  if (best.averageFloorDrawdownPct > 10) {
    notes.push("Average floor is still far from spot; prefer tighter put strikes if credit remains positive.");
  }

  if (best.averageLiquidity < 60) {
    notes.push("Liquidity is the weak point; require higher open interest before elevating candidates.");
  }

  if (best.averageCreditPct < 0.8) {
    notes.push("Average credit is modest; compare closer short calls only if the upside cap remains acceptable.");
  }

  if (previous?.topCandidate?.symbol && top?.symbol && previous.topCandidate.symbol !== top.symbol) {
    notes.push(`Leadership changed from ${previous.topCandidate.symbol} to ${top.symbol}; recheck whether this is quote movement or a real quality improvement.`);
  }

  return notes;
}

async function writeOutputs(snapshot, outputDir) {
  const jsonPath = join(outputDir, "credit-collar-quality-snapshot.json");
  const markdownPath = join(outputDir, "credit-collar-quality-report.md");

  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  await writeFile(markdownPath, renderMarkdown(snapshot));
}

function renderMarkdown(snapshot) {
  const acceptedRows = snapshot.accepted
    .map(
      (candidate) =>
        `| ${candidate.symbol} | ${candidate.score} | ${candidate.expiration} | ${candidate.buyPut} | ${candidate.sellCall} | ${candidate.netCredit} | ${candidate.protectedFloor} / ${candidate.floorDrawdownPct} | ${candidate.maxUpsidePct} | ${candidate.liquidityScore} |`,
    )
    .join("\n");

  const profileRows = snapshot.profileRuns
    .map(
      (run) =>
        `| ${run.profile} | ${run.qualityScore} | ${run.accepted} | ${run.rejected} | ${run.averageScore} | ${run.averageCreditPct}% | ${run.averageFloorDrawdownPct}% | ${run.averageLiquidity} |`,
    )
    .join("\n");

  return `# Credit Collar Quality Loop

Generated: ${snapshot.generatedAt}

Status: **${snapshot.status}**
Active profile: **${snapshot.activeProfile.label}**
Quality score: **${snapshot.qualityScore}/100**
Source: ${snapshot.source}${snapshot.degraded ? " (degraded/fallback)" : ""}

## Accepted candidates

| Symbol | Score | Expiration | Buy put | Sell call | Net credit | Protected floor | Max upside | Liquidity |
| --- | ---: | --- | --- | --- | ---: | --- | ---: | ---: |
${acceptedRows || "| None | - | - | - | - | - | - | - | - |"}

## Profile comparison

| Profile | Quality | Accepted | Rejected | Avg score | Avg credit | Avg floor drawdown | Avg liquidity |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${profileRows}

## Improvement notes

${snapshot.improvementNotes.map((note) => `- ${note}`).join("\n")}

## Guardrails

${snapshot.guardrails.map((guardrail) => `- ${guardrail}`).join("\n")}
`;
}

async function readPreviousSnapshot(outputDir) {
  const path = join(outputDir, "credit-collar-quality-snapshot.json");
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function concentrationRisk(candidates) {
  if (candidates.length < 4) return 4;
  const counts = new Map();
  for (const candidate of candidates) {
    const key = candidate.universe ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const largest = Math.max(...counts.values());
  return largest / candidates.length > 0.6 ? 5 : 0;
}

function rankStabilityBonus(candidates, previous) {
  if (!previous?.accepted?.length) return 0;
  const priorSymbols = new Set(previous.accepted.slice(0, 5).map((candidate) => candidate.symbol));
  const overlap = candidates.slice(0, 5).filter((candidate) => priorSymbols.has(candidate.symbol)).length;
  return Math.min(5, overlap);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--loop") {
      parsed.loop = true;
    } else if (arg === "--once") {
      parsed.iterations = "1";
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      parsed[key] = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function normalizeSymbols(value) {
  return String(value)
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length === 0) return 0;
  return clean.reduce((total, value) => total + value, 0) / clean.length;
}

function currency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

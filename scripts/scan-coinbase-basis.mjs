import { scanCoinbaseBasis } from "../server/coinbaseBasisScanner.mjs";

const args = new Set(process.argv.slice(2));
const assets = readArgValue("--assets");
const maxCandidates = readArgValue("--max");
const asJson = args.has("--json");

try {
  const payload = await scanCoinbaseBasis({ assets, maxCandidates });

  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    printSummary(payload);
  }
} catch (error) {
  console.error("Coinbase basis scan failed:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function printSummary(payload) {
  console.log(`Coinbase basis scan (${payload.source})`);
  console.log(`As of: ${payload.asOf}`);
  console.log(`Degraded: ${payload.degraded ? "yes" : "no"}`);
  if (payload.errors?.length) {
    console.log(`Notes: ${payload.errors.slice(0, 2).join(" | ")}`);
  }

  console.table(
    payload.candidates.map((candidate) => ({
      asset: candidate.asset,
      spot: candidate.spotProduct,
      perp: candidate.perpProduct,
      basisPct: candidate.basisPct,
      fundingPct: candidate.expectedFundingPct,
      convergencePct: candidate.expectedBasisConvergencePct,
      expectedProfitPct: candidate.expectedProfitPct,
      status: candidate.status,
      score: candidate.score,
    })),
  );
}

function readArgValue(name) {
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

import {
  calculateCoinbaseBasis,
  calculateExpectedProfit,
  coinbaseBasisFallbackCandidates,
  coinbaseBasisStrategy,
  enrichCoinbaseBasisCandidate,
  rankCoinbaseBasisCandidates,
} from "../src/data/coinbaseBasis.js";
import { discoverCoinbaseBasisPairs, normalizeAssets } from "../server/coinbaseBasisScanner.mjs";

const failures = [];
const fail = (message) => failures.push(message);

const expectedProfit = calculateExpectedProfit({
  expectedFunding: 0.0006,
  expectedBasisConvergence: 0.005,
  spotFees: 0.001,
  perpFees: 0.001,
  slippage: 0.0005,
  financingCarry: 0.0002,
  safetyBuffer: 0.0004,
});
if (!nearlyEqual(expectedProfit, 0.0025)) {
  fail(`Expected profit formula returned ${expectedProfit}, expected 0.0025.`);
}

const basis = calculateCoinbaseBasis({ spotPrice: 100, perpPrice: 101 });
if (!nearlyEqual(basis, 0.01)) {
  fail(`Basis formula returned ${basis}, expected 0.01.`);
}

const enriched = enrichCoinbaseBasisCandidate(
  {
    asset: "TEST",
    spotProduct: "TEST-USDC",
    perpProduct: "TEST-PERP",
    spotPrice: 100,
    perpPrice: 101,
    predictedFundingRate: 0.0002,
    spotSpreadRate: 0,
    perpSpreadRate: 0,
  },
  {
    fundingIntervals: 3,
    basisConvergenceFraction: 0.5,
    spotFeeRate: 0.001,
    perpFeeRate: 0.001,
    slippageRate: 0.0005,
    financingCarryRate: 0.0002,
    safetyBufferRate: 0.0004,
    minimumBasis: 0.001,
    minimumExpectedProfit: 0.002,
  },
);

if (!nearlyEqual(enriched.expectedProfit, 0.0025)) {
  fail(`Enriched expected profit ${enriched.expectedProfit} does not match component formula.`);
}

if (enriched.status !== "candidate") {
  fail("Buffered positive basis example should be marked as a candidate.");
}

if (coinbaseBasisFallbackCandidates.length < 4) {
  fail("Coinbase basis fallback feed must include at least four markets.");
}

const ranked = rankCoinbaseBasisCandidates(coinbaseBasisFallbackCandidates);
if (ranked.length !== coinbaseBasisFallbackCandidates.length) {
  fail("All fallback candidates should enrich into ranked scanner output.");
}

for (const candidate of ranked) {
  if (candidate.score < 0 || candidate.score > 100) {
    fail(`${candidate.asset} score ${candidate.score} is outside 0-100.`);
  }

  if (!candidate.reviewFlags.length) {
    fail(`${candidate.asset} must include review flags.`);
  }

  if (!candidate.calculation.expectedProfit.includes("expectedFunding")) {
    fail(`${candidate.asset} is missing expected-profit calculation metadata.`);
  }
}

for (let index = 1; index < ranked.length; index += 1) {
  if (ranked[index].expectedProfit > ranked[index - 1].expectedProfit) {
    fail("Ranked Coinbase basis candidates must be sorted by expected profit.");
  }
}

const pairs = discoverCoinbaseBasisPairs(
  [
    { instrument_name: "BTC-PERP" },
    { instrument_name: "BTC-USDC" },
    { instrument_name: "ETH-PERP" },
    { instrument_name: "ETH-USD" },
  ],
  ["btc", "eth"],
);
if (pairs.length !== 2 || pairs[0].spotProduct !== "BTC-USDC" || pairs[1].spotProduct !== "ETH-USD") {
  fail("Coinbase pair discovery did not match expected spot/perp instruments.");
}

const normalizedAssets = normalizeAssets("btc, eth, BTC, bad-symbol!");
if (normalizedAssets.join(",") !== "BTC,ETH") {
  fail(`Asset normalization returned ${normalizedAssets.join(",")}, expected BTC,ETH.`);
}

const prohibitedClaims = [/guaranteed/i, /risk[- ]?free/i, /will profit/i, /must buy/i];
const combinedCopy = JSON.stringify({ coinbaseBasisStrategy, ranked });
for (const pattern of prohibitedClaims) {
  if (pattern.test(combinedCopy)) {
    fail(`Coinbase basis scanner copy contains prohibited claim pattern: ${pattern}.`);
  }
}

if (failures.length > 0) {
  console.error("Coinbase basis check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Coinbase basis check passed.");

function nearlyEqual(actual, expected) {
  return Math.abs(actual - expected) < 1e-10;
}

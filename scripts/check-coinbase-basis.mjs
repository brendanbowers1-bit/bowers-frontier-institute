import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateCoinbaseBasis,
  calculateExpectedProfit,
  coinbaseBasisFallbackCandidates,
  coinbaseBasisStrategy,
  enrichCoinbaseBasisCandidate,
  rankCoinbaseBasisCandidates,
} from "../src/data/coinbaseBasis.js";
import {
  assertPublicMarketRequest,
  fetchPublicMarketJson,
  hasExplicitExecutionKeys,
  refuseLiveOrder,
  runTradeControl,
} from "../src/lib/coinbaseTradeSafety.js";
import {
  discoverCoinbaseBasisPairs,
  normalizeAssets,
  scanCoinbaseBasis,
} from "../server/coinbaseBasisScanner.mjs";

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

const sampleCandidate = ranked[0];
const fetchSpy = createFetchSpy();
for (const action of ["simulate", "review", "export", "locked"]) {
  const result = runTradeControl({
    action,
    candidate: sampleCandidate,
    env: {},
    fetchImpl: fetchSpy,
  });
  if (result.executed) {
    fail(`Trade control "${action}" must not mark a live order as executed.`);
  }
  if (fetchSpy.calls.length > 0) {
    fail(`Trade control "${action}" called a network endpoint: ${fetchSpy.calls.join(", ")}`);
  }
}

const lockedWithoutKeys = runTradeControl({
  action: "locked",
  candidate: sampleCandidate,
  env: {},
  fetchImpl: fetchSpy,
});
if (!lockedWithoutKeys.message.includes("missing explicit API keys")) {
  fail("Locked auto-trade must refuse execution when Coinbase keys are absent.");
}

const lockedWithKeys = runTradeControl({
  action: "locked",
  candidate: sampleCandidate,
  env: { COINBASE_API_KEY: "test-key", COINBASE_API_SECRET: "test-secret" },
  fetchImpl: fetchSpy,
});
if (lockedWithKeys.executed || fetchSpy.calls.length > 0) {
  fail("Explicit Coinbase keys must still be unable to place a live order.");
}
if (!lockedWithKeys.message.includes("even when API keys are present")) {
  fail("Locked auto-trade must remain disabled after keys are supplied.");
}

if (hasExplicitExecutionKeys({})) {
  fail("Empty environment must not count as explicit Coinbase execution keys.");
}
if (!hasExplicitExecutionKeys({ COINBASE_API_KEY: "key", COINBASE_API_SECRET: "secret" })) {
  fail("Both Coinbase API key and secret should count as explicit execution keys.");
}

let refusedWithoutKeys = false;
try {
  refuseLiveOrder({ env: {}, fetchImpl: fetchSpy });
} catch (error) {
  refusedWithoutKeys = String(error.message).includes("missing explicit API keys");
}
if (!refusedWithoutKeys || fetchSpy.calls.length > 0) {
  fail("refuseLiveOrder must fail closed without keys and never call fetch.");
}

let refusedWithKeys = false;
try {
  refuseLiveOrder({
    env: { COINBASE_API_KEY: "key", COINBASE_API_SECRET: "secret" },
    fetchImpl: fetchSpy,
    url: "https://api.international.coinbase.com/api/v1/orders",
  });
} catch (error) {
  refusedWithKeys = String(error.message).includes("even when API keys are present");
}
if (!refusedWithKeys || fetchSpy.calls.length > 0) {
  fail("refuseLiveOrder must block /orders even when explicit keys are present.");
}

try {
  assertPublicMarketRequest("https://api.international.coinbase.com/api/v1/orders", {
    method: "POST",
  });
  fail("Order POST must not pass the public market-data allowlist.");
} catch (error) {
  if (!String(error.message).includes("GET market data only")) {
    fail(`Unexpected allowlist error for order POST: ${error.message}`);
  }
}

let orderFetchBlocked = false;
try {
  await fetchPublicMarketJson(
    "https://api.international.coinbase.com/api/v1/orders",
    fetchSpy,
    { method: "POST", body: JSON.stringify({ side: "buy" }) },
  );
} catch (error) {
  orderFetchBlocked = /order endpoint blocked|GET market data only/.test(error.message);
}
if (!orderFetchBlocked || fetchSpy.calls.length > 0) {
  fail("fetchPublicMarketJson must reject live order endpoints before fetch runs.");
}

const scanSpy = createFetchSpy(mockCoinbaseMarketResponse);
const scanResult = await scanCoinbaseBasis({
  assets: ["BTC"],
  maxCandidates: 1,
  fetchImpl: scanSpy,
  baseUrl: "https://api.international.coinbase.com/api/v1",
});
if (scanResult.candidates.length !== 1 || scanResult.candidates[0].asset !== "BTC") {
  fail("Mocked Coinbase scan should return one BTC candidate.");
}
if (scanSpy.calls.some((url) => /order|execution|fill|transfer|withdraw/i.test(url))) {
  fail(`Scanner requested a live order-style endpoint: ${scanSpy.calls.join(", ")}`);
}
for (const url of scanSpy.calls) {
  try {
    assertPublicMarketRequest(url);
  } catch (error) {
    fail(`Scanner requested a non-allowlisted URL ${url}: ${error.message}`);
  }
}

const sourceRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeSources = [
  "server/coinbaseBasisScanner.mjs",
  "api/coinbase-basis.js",
  "netlify/functions/coinbase-basis.mjs",
  "src/components/CoinbaseBasisFeed.jsx",
  "src/lib/coinbaseBasisFeedClient.js",
];
for (const relativePath of runtimeSources) {
  const source = readFileSync(join(sourceRoot, relativePath), "utf8");
  if (/api\.international\.coinbase\.com\/api\/v1\/orders/i.test(source)) {
    fail(`${relativePath} hard-codes a live Coinbase order endpoint.`);
  }
  if (/\bfetch(PublicMarketJson)?\([^)]*\/orders/i.test(source)) {
    fail(`${relativePath} appears to fetch a Coinbase order endpoint.`);
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

function createFetchSpy(handler) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push(url);
    if (typeof handler === "function") {
      return handler(url, init);
    }
    throw new Error(`Unexpected Coinbase fetch: ${url}`);
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

function mockCoinbaseMarketResponse(url) {
  const parsed = new URL(url);
  if (parsed.pathname === "/api/v1/instruments") {
    return jsonResponse([
      { instrument_name: "BTC-PERP" },
      { instrument_name: "BTC-USDC" },
    ]);
  }
  if (parsed.pathname.endsWith("/quote")) {
    return jsonResponse({
      best_bid_price: "100",
      best_ask_price: "101",
      mark_price: "100.6",
      predicted_funding: "0.0002",
    });
  }
  throw new Error(`Unexpected Coinbase market URL ${url}`);
}

function jsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

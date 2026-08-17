import {
  coinbaseBasisFallbackCandidates,
  coinbaseBasisStrategy,
  rankCoinbaseBasisCandidates,
} from "../src/data/coinbaseBasis.js";

const DEFAULT_BASE_URL =
  process.env.COINBASE_INTX_BASE_URL ?? "https://api.international.coinbase.com/api/v1";
const DEFAULT_ASSETS = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "LINK"];
const ASSET_PATTERN = /^[A-Z0-9]{2,12}$/;

export async function scanCoinbaseBasis({
  assets = process.env.COINBASE_BASIS_ASSETS ?? DEFAULT_ASSETS,
  maxCandidates = 8,
  fetchImpl = globalThis.fetch,
  baseUrl = DEFAULT_BASE_URL,
  strategyOptions = {},
} = {}) {
  const requestedAssets = normalizeAssets(assets);
  const candidateLimit = clampInteger(maxCandidates, 1, 25);

  try {
    const liveResult = await scanLiveCoinbaseBasis({
      assets: requestedAssets,
      baseUrl,
      fetchImpl,
      strategyOptions,
    });

    if (liveResult.candidates.length > 0) {
      return {
        asOf: new Date().toISOString(),
        source: "Coinbase International Exchange public instruments and quotes",
        degraded: liveResult.degraded,
        strategy: coinbaseBasisStrategy,
        errors: liveResult.errors.slice(0, 4),
        candidates: liveResult.candidates.slice(0, candidateLimit),
      };
    }
  } catch (error) {
    return fallbackPayload({
      maxCandidates: candidateLimit,
      strategyOptions,
      errors: [messageFromError(error)],
    });
  }

  return fallbackPayload({
    maxCandidates: candidateLimit,
    strategyOptions,
    errors: ["No Coinbase perp/spot pairs produced a complete quote set."],
  });
}

export async function scanLiveCoinbaseBasis({
  assets,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch,
  strategyOptions = {},
}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required for Coinbase basis scanning.");
  }

  const instruments = await fetchJson(`${trimTrailingSlash(baseUrl)}/instruments`, fetchImpl);
  const pairs = discoverCoinbaseBasisPairs(instruments, assets);
  const settled = await Promise.allSettled(
    pairs.map((pair) => fetchBasisCandidate(pair, baseUrl, fetchImpl)),
  );
  const errors = [];
  const rawCandidates = [];

  for (const result of settled) {
    if (result.status === "fulfilled") {
      rawCandidates.push(result.value);
    } else {
      errors.push(messageFromError(result.reason));
    }
  }

  return {
    degraded: errors.length > 0 || rawCandidates.length < pairs.length,
    errors,
    candidates: rankCoinbaseBasisCandidates(rawCandidates, strategyOptions),
  };
}

export function discoverCoinbaseBasisPairs(instruments, assets = DEFAULT_ASSETS) {
  const requestedAssets = new Set(normalizeAssets(assets));
  const names = new Set(
    instruments
      .map((instrument) => readInstrumentName(instrument))
      .filter(Boolean)
      .map((name) => name.toUpperCase()),
  );
  const pairs = [];

  for (const asset of requestedAssets) {
    const perpProduct = findFirstProduct(names, [`${asset}-PERP`, `${asset}-USD-PERP`]);
    const spotProduct = findFirstProduct(names, [
      `${asset}-USDC`,
      `${asset}-USD`,
      `${asset}-USDT`,
    ]);

    if (perpProduct && spotProduct) {
      pairs.push({ asset, spotProduct, perpProduct });
    }
  }

  if (pairs.length > 0) return pairs;

  return [...requestedAssets].map((asset) => ({
    asset,
    spotProduct: `${asset}-USDC`,
    perpProduct: `${asset}-PERP`,
  }));
}

export function normalizeAssets(assets) {
  const list =
    typeof assets === "string"
      ? assets.split(",")
      : Array.isArray(assets)
        ? assets
        : DEFAULT_ASSETS;

  return [
    ...new Set(
      list
        .map((asset) => String(asset).trim().toUpperCase())
        .filter((asset) => ASSET_PATTERN.test(asset)),
    ),
  ].slice(0, 25);
}

async function fetchBasisCandidate(pair, baseUrl, fetchImpl) {
  const [spotQuote, perpQuote] = await Promise.all([
    fetchQuote(pair.spotProduct, baseUrl, fetchImpl),
    fetchQuote(pair.perpProduct, baseUrl, fetchImpl),
  ]);
  const spot = extractQuotePrice(spotQuote, { preferMark: false });
  const perp = extractQuotePrice(perpQuote, { preferMark: true });
  const predictedFundingRate =
    extractFundingRate(perpQuote) ??
    (await fetchHistoricalFundingRate(pair.perpProduct, baseUrl, fetchImpl));

  return {
    ...pair,
    spotPrice: spot.price,
    perpPrice: perp.price,
    spotBid: spot.bid,
    spotAsk: spot.ask,
    perpBid: perp.bid,
    perpAsk: perp.ask,
    spotSpreadRate: spot.spreadRate,
    perpSpreadRate: perp.spreadRate,
    predictedFundingRate: predictedFundingRate ?? 0,
    markPrice: numberFrom(perpQuote.mark_price ?? perpQuote.markPrice),
    indexPrice: numberFrom(perpQuote.index_price ?? perpQuote.indexPrice),
    source: "Coinbase INTX quote",
  };
}

async function fetchQuote(product, baseUrl, fetchImpl) {
  return fetchJson(
    `${trimTrailingSlash(baseUrl)}/instruments/${encodeURIComponent(product)}/quote`,
    fetchImpl,
  );
}

async function fetchHistoricalFundingRate(product, baseUrl, fetchImpl) {
  try {
    const payload = await fetchJson(
      `${trimTrailingSlash(baseUrl)}/instruments/${encodeURIComponent(
        product,
      )}/funding?result_limit=8`,
      fetchImpl,
    );
    return extractFundingRate(payload);
  } catch {
    return null;
  }
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BR3N-Coinbase-Basis-Scanner/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Coinbase request failed with ${response.status} for ${url}`);
  }

  return response.json();
}

function extractQuotePrice(quote, { preferMark }) {
  const bid = numberFrom(
    quote.best_bid_price ?? quote.best_bid ?? quote.bid_price ?? quote.bid,
  );
  const ask = numberFrom(
    quote.best_ask_price ?? quote.best_ask ?? quote.ask_price ?? quote.ask,
  );
  const mid = bid && ask ? (bid + ask) / 2 : null;
  const mark = numberFrom(quote.mark_price ?? quote.markPrice);
  const trade = numberFrom(
    quote.trade_price ?? quote.last_trade_price ?? quote.last_price ?? quote.price,
  );
  const index = numberFrom(quote.index_price ?? quote.indexPrice);
  const price = preferMark ? mark ?? mid ?? trade ?? index : mid ?? trade ?? mark ?? index;

  if (!price) {
    throw new Error("Coinbase quote did not include a usable price.");
  }

  return {
    price,
    bid,
    ask,
    spreadRate: bid && ask && mid ? (ask - bid) / mid : 0,
  };
}

function extractFundingRate(payload) {
  if (Array.isArray(payload)) {
    return normalizeFundingRate(
      numberFrom(payload[0]?.final_funding_rate ?? payload[0]?.funding_rate ?? payload[0]?.rate),
    );
  }

  const direct = numberFrom(
    payload.predicted_funding ??
      payload.predictedFunding ??
      payload.funding_rate ??
      payload.final_funding_rate ??
      payload.rate,
  );
  if (direct !== null) return normalizeFundingRate(direct);

  const nested =
    payload.results ??
    payload.result ??
    payload.funding_rates ??
    payload.fundingRates ??
    payload.data;
  if (Array.isArray(nested) && nested.length > 0) {
    return extractFundingRate(nested);
  }

  return null;
}

function normalizeFundingRate(rate) {
  if (rate === null) return null;
  return Math.abs(rate) > 0.2 ? rate / 100 : rate;
}

function readInstrumentName(instrument) {
  return (
    instrument.instrument_name ??
    instrument.instrumentName ??
    instrument.name ??
    instrument.symbol ??
    instrument.product_id ??
    instrument.productId ??
    instrument.instrument ??
    ""
  );
}

function findFirstProduct(names, candidates) {
  return candidates.find((candidate) => names.has(candidate)) ?? null;
}

function fallbackPayload({ maxCandidates, strategyOptions, errors }) {
  return {
    asOf: new Date().toISOString(),
    source: "Static Coinbase INTX basis snapshot fallback",
    degraded: true,
    strategy: coinbaseBasisStrategy,
    errors,
    candidates: rankCoinbaseBasisCandidates(
      coinbaseBasisFallbackCandidates,
      strategyOptions,
    ).slice(0, maxCandidates),
  };
}

function numberFrom(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function trimTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

function clampInteger(value, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function messageFromError(error) {
  return error instanceof Error ? error.message : String(error);
}

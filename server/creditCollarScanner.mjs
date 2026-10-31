import {
  creditCollarCandidates,
  optimizeCreditCollars,
} from "../src/data/creditCollars.js";

const DEFAULT_SYMBOLS = ["QQQ", "SPY", "NVDA", "MSFT", "GOOGL", "META", "AMZN", "AVGO", "PLTR", "TSLA"];
const SYMBOL_PATTERN = /^[A-Z0-9.]{1,10}$/;
const SYMBOL_META = {
  QQQ: { name: "Nasdaq 100 ETF", universe: "Index", tags: ["Nasdaq", "Mega-cap tech", "Index hedge"] },
  SPY: { name: "S&P 500 ETF", universe: "Index", tags: ["S&P 500", "Core beta", "Index hedge"] },
  NVDA: { name: "NVIDIA", universe: "AI leaders", tags: ["AI compute", "Semiconductor", "High liquidity"] },
  MSFT: { name: "Microsoft", universe: "AI leaders", tags: ["AI platform", "Cloud", "Mega-cap"] },
  GOOGL: { name: "Alphabet", universe: "AI leaders", tags: ["AI search", "Cloud", "Mega-cap"] },
  META: { name: "Meta Platforms", universe: "AI leaders", tags: ["AI infrastructure", "Ad tech", "Higher credit"] },
  AMZN: { name: "Amazon", universe: "AI leaders", tags: ["AWS", "AI services", "Retail beta"] },
  AVGO: { name: "Broadcom", universe: "Semiconductors", tags: ["AI networking", "Semiconductor", "Infrastructure"] },
  PLTR: { name: "Palantir", universe: "AI software", tags: ["AI software", "High beta", "Tighter floor"] },
  TSLA: { name: "Tesla", universe: "AI high beta", tags: ["AI autonomy", "High beta", "Event risk"] },
};

const OPTION_SYMBOL_PATTERN = /^(.+?)(\d{6})([CP])(\d{8})$/;

export async function scanCreditCollars({ symbols = DEFAULT_SYMBOLS, maxPerSymbol = 2 } = {}) {
  const requestedSymbols = normalizeSymbols(symbols).slice(0, 20);
  const settled = await Promise.allSettled(requestedSymbols.map((symbol) => scanSymbol(symbol, maxPerSymbol)));
  const candidates = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  if (candidates.length === 0) {
    return {
      asOf: new Date().toISOString(),
      source: "Static delayed snapshot fallback",
      degraded: true,
      candidates: optimizeCreditCollars(creditCollarCandidates, "balanced"),
    };
  }

  return {
    asOf: new Date().toISOString(),
    source: "Cboe delayed options via serverless proxy",
    degraded: settled.some((result) => result.status === "rejected"),
    candidates: optimizeCreditCollars(candidates, "balanced"),
  };
}

function normalizeSymbols(symbols) {
  const normalize = (symbol) => String(symbol).trim().toUpperCase();
  const isValidSymbol = (symbol) => SYMBOL_PATTERN.test(symbol);

  if (typeof symbols === "string") {
    return [...new Set(symbols.split(",").map(normalize).filter(isValidSymbol))];
  }

  return [...new Set(symbols.map(normalize).filter(isValidSymbol))];
}

async function scanSymbol(symbol, maxPerSymbol) {
  const response = await fetch(`https://cdn.cboe.com/api/global/delayed_quotes/options/${symbol}.json`, {
    headers: { "User-Agent": "BR3N-Credit-Collar-Research/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Cboe returned ${response.status} for ${symbol}`);
  }

  const payload = await response.json();
  const data = payload.data;
  const spot = number(data?.current_price);
  if (!spot) {
    throw new Error(`Missing spot price for ${symbol}`);
  }

  const putsByExpiration = new Map();
  const callsByExpiration = new Map();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const option of data.options ?? []) {
    const parsed = parseOptionSymbol(option.option);
    if (!parsed) continue;

    const dte = Math.round((parsed.expiration.getTime() - today.getTime()) / 86_400_000);
    if (dte < 25 || dte > 120) continue;

    const bid = number(option.bid);
    const ask = number(option.ask);
    if (bid <= 0 || ask <= 0) continue;

    const record = {
      expiration: parsed.expiration,
      expirationKey: parsed.expiration.toISOString().slice(0, 10),
      dte,
      strike: parsed.strike,
      bid,
      ask,
      openInterest: number(option.open_interest),
      volume: number(option.volume),
    };
    const targetMap = parsed.type === "P" ? putsByExpiration : callsByExpiration;
    const list = targetMap.get(record.expirationKey) ?? [];
    list.push(record);
    targetMap.set(record.expirationKey, list);
  }

  const candidates = [];
  for (const [expirationKey, puts] of putsByExpiration.entries()) {
    const calls = callsByExpiration.get(expirationKey) ?? [];
    for (const put of puts) {
      const putGapPct = ((spot - put.strike) / spot) * 100;
      if (putGapPct < 6 || putGapPct > 12) continue;

      for (const call of calls) {
        const callCapPct = ((call.strike - spot) / spot) * 100;
        const netCredit = call.bid - put.ask;
        const minimumOpenInterest = Math.min(put.openInterest, call.openInterest);
        if (callCapPct < 5 || callCapPct > 14 || netCredit <= 0 || minimumOpenInterest < 100) continue;

        candidates.push(buildCandidate(symbol, spot, expirationKey, put, call, data));
      }
    }
  }

  return optimizeCreditCollars(candidates, "balanced").slice(0, maxPerSymbol);
}

function buildCandidate(symbol, spot, expiration, put, call, data) {
  const meta = SYMBOL_META[symbol] ?? {
    name: symbol,
    universe: "Watchlist",
    tags: ["Custom symbol", "Live scan"],
  };

  return {
    id: `${symbol.toLowerCase()}-${expiration}-${put.strike}-${call.strike}`.replaceAll(".", "-"),
    symbol,
    name: meta.name,
    universe: meta.universe,
    spot,
    iv30: number(data.iv30),
    expiration,
    dte: put.dte,
    putStrike: put.strike,
    putBid: put.bid,
    putAsk: put.ask,
    callStrike: call.strike,
    callBid: call.bid,
    callAsk: call.ask,
    putOpenInterest: put.openInterest,
    callOpenInterest: call.openInterest,
    putVolume: put.volume,
    callVolume: call.volume,
    tags: meta.tags,
  };
}

function parseOptionSymbol(optionSymbol) {
  const match = OPTION_SYMBOL_PATTERN.exec(optionSymbol ?? "");
  if (!match) return null;

  const [, , compactDate, type, strike] = match;
  const year = 2000 + Number(compactDate.slice(0, 2));
  const month = Number(compactDate.slice(2, 4)) - 1;
  const day = Number(compactDate.slice(4, 6));

  return {
    expiration: new Date(Date.UTC(year, month, day)),
    type,
    strike: Number(strike) / 1000,
  };
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

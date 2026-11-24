import assert from "node:assert/strict";
import { test } from "node:test";
import { enrichCreditCollar, optimizeCreditCollars } from "../src/data/creditCollars.js";
import { normalizeSymbols, scanCreditCollars } from "../server/creditCollarScanner.mjs";

test("normalizeSymbols drops invalid tickers and de-duplicates", () => {
  assert.deepEqual(normalizeSymbols("qqq, SPY, bad ticker, NVDA, spy"), ["QQQ", "SPY", "NVDA"]);
  assert.deepEqual(normalizeSymbols(["pltr", "???"]), ["PLTR"]);
  assert.deepEqual(normalizeSymbols("javascript:alert(1)"), []);
});

test("positive-credit collars score within 0-100 and keep a put below spot", () => {
  const ranked = optimizeCreditCollars(undefined, "balanced");
  assert.ok(ranked.length >= 8);
  for (const candidate of ranked) {
    assert.ok(candidate.netCredit > 0, `${candidate.symbol} must remain a credit`);
    assert.ok(candidate.putStrike < candidate.spot);
    assert.ok(candidate.callStrike > candidate.spot);
    assert.ok(candidate.score >= 0 && candidate.score <= 100);
  }
});

test("enrichCreditCollar floors drawdown from put plus net credit", () => {
  const enriched = enrichCreditCollar({
    symbol: "TEST",
    name: "Test",
    universe: "Index",
    spot: 100,
    iv30: 20,
    expiration: "2026-12-18",
    dte: 45,
    putStrike: 90,
    putBid: 1.5,
    putAsk: 1.6,
    callStrike: 110,
    callBid: 2.4,
    callAsk: 2.5,
    putOpenInterest: 2500,
    callOpenInterest: 1800,
    putVolume: 400,
    callVolume: 220,
    tags: ["Test"],
  });
  assert.equal(enriched.netCredit, 0.8);
  assert.equal(enriched.floorValue, 90.8);
  assert.ok(enriched.floorDrawdownPct > 0);
});

test("scanCreditCollars degrades to the static snapshot when upstream fails", async () => {
  const payload = await scanCreditCollars({
    symbols: "QQQ,SPY",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(payload.degraded, true);
  assert.match(payload.source, /snapshot fallback/i);
  assert.ok(payload.candidates.length >= 8);
  assert.ok(payload.candidates.every((candidate) => candidate.netCredit > 0));
});

test("scanCreditCollars treats aborted fetches as timeouts and still falls back", async () => {
  const payload = await scanCreditCollars({
    symbols: ["NVDA"],
    fetchImpl: async (_url, init) => {
      const error = new Error("aborted");
      error.name = "AbortError";
      init?.signal?.throwIfAborted?.();
      throw error;
    },
  });
  assert.equal(payload.degraded, true);
  assert.match(payload.source, /snapshot fallback/i);
});

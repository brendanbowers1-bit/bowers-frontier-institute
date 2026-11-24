import assert from "node:assert/strict";
import test from "node:test";
import hypotheses from "../data/research/hypotheses.json" with { type: "json" };

test("research JSON is paper-only with no live trading surface", () => {
  assert.equal(hypotheses.paperResearchOnly, true);
  assert.equal(hypotheses.noTradeExecution, true);
  assert.equal(hypotheses.noLiveOrders, true);
  assert.equal(hypotheses.noRealFunds, true);
  assert.equal(hypotheses.noExchangeApiKeys, true);
  assert.equal(hypotheses.noTradingSignals, true);
});

test("falsified holdout verdicts stay published with source PRs", () => {
  assert.equal(hypotheses.noLiveFetchAtRuntime, true);
  assert.equal(hypotheses.hypotheses.length, 6);
  const byId = Object.fromEntries(hypotheses.hypotheses.map((item) => [item.id, item]));

  const maker = byId["kalshi-maker-spread"];
  assert.equal(maker.status, "falsified");
  assert.equal(maker.n, 327);
  assert.match(maker.metrics[0].value, /−111 bps/);
  assert.equal(maker.prUrl, "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/16");

  const fxRv = byId["fx-realized-vol"];
  assert.equal(fxRv.status, "falsified");
  assert.equal(fxRv.n, 40824);
  assert.match(fxRv.verdict, /No robust winner/i);
  assert.equal(fxRv.prUrl, "https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/10");

  const fade = byId["fade-the-favorite"];
  assert.equal(fade.status, "falsified");
  assert.equal(fade.n, 800);
  assert.match(fade.metrics[0].value, /−706 bps/);
  assert.equal(fade.prUrl, "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/10");

  const leadLag = byId["pm-spot-lead-lag"];
  assert.equal(leadLag.status, "falsified");
  assert.equal(leadLag.n, 1057);
  assert.match(leadLag.metrics[0].value, /−20\.01 bps/);
  assert.equal(leadLag.prUrl, "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/13");

  const fx = byId["fx-reversal-vs-random-walk"];
  assert.equal(fx.status, "falsified");
  assert.equal(fx.n, 40824);
  assert.equal(fx.metrics[0].value, "0.0056835375");
  assert.equal(fx.metrics[1].value, "0.0039386066");
  assert.equal(fx.prUrl, "https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/9");
  assert.match(fx.verdict, /worse than random walk/i);

  const walk = byId["ecb-usd-major-walk-forward"];
  assert.equal(walk.status, "falsified");
  assert.equal(walk.prUrl, "https://github.com/brendanbowers1-bit/bowers-frontier-institute/pull/6");
  assert.match(walk.metrics[1].value, /48\.8%/);
});

import assert from "node:assert/strict";
import test from "node:test";
import registry from "../data/research/falsification.json" with { type: "json" };
import health from "../public/health.json" with { type: "json" };

test("falsification JSON is paper-only and not a trading edge", () => {
  assert.equal(registry.paperResearchOnly, true);
  assert.equal(registry.noTradeExecution, true);
  assert.equal(registry.noLiveOrders, true);
  assert.equal(registry.noTradingSignals, true);
  assert.equal(registry.noLiveFetchAtRuntime, true);
  assert.equal(registry.notATradingEdge, true);
  assert.match(registry.disclaimer, /not a trading edge/i);
});

test("display statuses cover FALSIFIED, FAIL-N, UNSCORED, and PASS", () => {
  assert.equal(registry.hypotheses.length, 14);
  assert.deepEqual(registry.statusCounts, {
    FALSIFIED: 10,
    "FAIL-N": 1,
    UNSCORED: 2,
    PASS: 1,
  });

  const byId = Object.fromEntries(registry.hypotheses.map((item) => [item.id, item]));
  const maker = byId["kalshi-maker-spread-queue-as-v1"];
  assert.equal(maker.displayStatus, "FAIL-N");
  assert.equal(maker.labVerdict, "FALSIFIED");
  assert.equal(maker.n, 327);
  assert.equal(maker.nTarget, 400);
  assert.match(maker.verdict, /FAIL-N/);

  const fade = byId["kalshi-fade-favorite-calibration-v1"];
  assert.equal(fade.displayStatus, "FALSIFIED");
  assert.equal(fade.n, 800);

  const buyFavorite = byId["kalshi-buy-favorite-v1"];
  assert.equal(buyFavorite.displayStatus, "UNSCORED");
  assert.equal(buyFavorite.n, null);

  const pass = byId["fx-rv-horizon-5-22-v1"];
  assert.equal(pass.displayStatus, "PASS");
  assert.match(pass.verdict, /not a trading edge/i);
  assert.match(pass.verdict, /Evidence advancement denied/i);

  for (const item of registry.hypotheses) {
    assert.match(item.verdict, /not a trading edge/i);
    assert.equal(["FALSIFIED", "FAIL-N", "UNSCORED", "PASS"].includes(item.displayStatus), true);
  }
});

test("static health document mirrors registry counts without a DSN", () => {
  assert.equal(health.status, "ok");
  assert.equal(health.researchOnly, true);
  assert.equal(health.noTradeExecution, true);
  assert.equal(health.errorTrackerDsnConfigured, false);
  assert.equal(health.registry.hypothesisCount, 14);
  assert.deepEqual(health.registry.statusCounts, registry.statusCounts);
  assert.equal(health.registry.route, "/research/falsification.json");
  assert.equal(health.registry.page, "/falsification.html");
});

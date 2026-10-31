import assert from "node:assert/strict";
import test from "node:test";

import {
  createDecisionRecord,
  evidenceRegistry,
  replayAllScenarios,
  scenarioMatrix,
  validateReplayMatrixShape,
} from "../src/replay.mjs";

const cloneRegistry = () => structuredClone(evidenceRegistry);
const codes = (reasons) => reasons.map((reason) => reason.code);
const scenarioById = (id) => scenarioMatrix.scenarios.find((scenario) => scenario.id === id);

test("replay matrix loads exactly 10 unique scenarios", () => {
  const shape = validateReplayMatrixShape();
  assert.equal(shape.ok, true);
  assert.equal(shape.scenarioCount, 10);
  assert.equal(shape.uniqueScenarioCount, 10);
});

test("every referenced evidence ID exists", () => {
  const sources = new Set(evidenceRegistry.sources.map((source) => source.id));
  for (const scenario of scenarioMatrix.scenarios) {
    for (const evidenceId of scenario.evidenceIds) assert.ok(sources.has(evidenceId));
  }
});

test("every replay matches expected status fields and reason codes", () => {
  const records = replayAllScenarios();
  assert.equal(records.length, 10);
  for (const record of records) {
    const scenario = scenarioById(record.scenarioId);
    assert.equal(record.creditedStatus, scenario.expected.creditedStatus);
    assert.equal(record.tradableStatus, scenario.expected.tradableStatus);
    assert.equal(record.externallyTransferableStatus, scenario.expected.externallyTransferableStatus);
    assert.equal(record.eta, scenario.expected.eta);
    assert.equal(record.cost, scenario.expected.cost);
    assert.equal(record.finality, scenario.expected.finality);
    assert.equal(record.holdRisk, scenario.expected.holdRisk);
    assert.equal(record.confidence, scenario.expected.confidence);
    assert.deepEqual(codes(record.reasonCodes), scenario.expected.reasonCodes);
    assert.deepEqual(record.rejectedRoutes, scenario.expected.rejectedRoutes);
    assert.deepEqual(record.fallback, scenario.expected.fallback);
    assert.deepEqual(codes(record.evidenceValidationFailures), scenario.expected.evidenceValidationFailures);
  }
});

test("missing, expired, unvalidated, scope-mismatched, and unapproved evidence fail closed", () => {
  const cases = [
    ["scenario-001-fully-available-same-day", (registry) => { registry.sources = registry.sources.filter((source) => source.id !== "synthetic-market-access-fixture-2026-08"); }, "EVIDENCE_SOURCE_MISSING"],
    ["scenario-001-fully-available-same-day", (registry) => { registry.sources[1].expiresAt = "2026-08-25"; }, "EVIDENCE_SOURCE_EXPIRED"],
    ["scenario-001-fully-available-same-day", (registry) => { registry.sources[1].status = "fixture"; }, "EVIDENCE_SOURCE_UNVALIDATED"],
    ["scenario-001-fully-available-same-day", (registry) => { registry.sources[1].stewardApproval = { approved: false }; }, "EVIDENCE_FIXTURE_REQUIRES_STEWARD_APPROVAL"],
    ["scenario-009-scope-mismatch-fail-closed", () => {}, "EVIDENCE_SCOPE_MISMATCH"],
  ];

  for (const [scenarioId, mutate, expectedCode] of cases) {
    const registry = cloneRegistry();
    mutate(registry);
    const record = createDecisionRecord({ scenario: scenarioById(scenarioId), registry });
    assert.equal(record.creditedStatus, "fail_closed");
    assert.ok(codes(record.reasonCodes).includes(expectedCode));
  }
});

test("decision records are deterministic and deeply immutable", () => {
  const scenario = scenarioById("scenario-004-before-cutoff-same-day");
  const firstRecord = createDecisionRecord({ scenario });
  const secondRecord = createDecisionRecord({ scenario });
  assert.deepEqual(firstRecord, secondRecord);
  assert.equal(Object.isFrozen(firstRecord), true);
  assert.equal(Object.isFrozen(firstRecord.reasonCodes), true);
  assert.throws(() => firstRecord.reasonCodes.push({ code: "MUTATED" }), TypeError);
});

test("rejected routes and fallbacks are retained", () => {
  const record = createDecisionRecord({ scenario: scenarioById("scenario-010-preferred-rejected-valid-fallback") });
  assert.deepEqual(record.rejectedRoutes, [{ routeId: "preferred-payment-initiation", reasonCodes: ["PAYMENT_INITIATION_BLOCKED"] }]);
  assert.deepEqual(record.fallback, { routeId: "research-only-next-business-day-fallback", selected: true });
});

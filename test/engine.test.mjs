import assert from "node:assert/strict";
import test from "node:test";

import { EvidenceValidationError, createAvailabilityEngine, startupEvidenceValidation } from "../src/engine.mjs";
import { availabilityPolicies } from "../src/policies.mjs";

const validRegistry = Object.freeze({
  schemaVersion: "1.0.0",
  registryVersion: "test.2026.08",
  checkedAt: "2026-08-26",
  sources: [
    { id: "public-boundary-brief-2026-08", sourceKind: "public_research_note", status: "validated", asOf: "2026-08-20", expiresAt: "2026-11-20", stewardApproval: { approved: true } },
    { id: "synthetic-market-access-fixture-2026-08", sourceKind: "synthetic_fixture", status: "validated", asOf: "2026-08-21", expiresAt: "2026-11-21", stewardApproval: { approved: true } },
    { id: "research-purpose-taxonomy-2026-08", sourceKind: "synthetic_fixture", status: "validated", asOf: "2026-08-22", expiresAt: "2026-11-22", stewardApproval: { approved: true } },
  ],
});

const cloneRegistry = () => structuredClone(validRegistry);
const reasonCodes = (error) => error.reasonCodes.map((reason) => reason.code);

test("startup evidence registry validates every policy source", () => {
  assert.equal(startupEvidenceValidation.ok, true);
  assert.deepEqual(startupEvidenceValidation.reasonCodes.map((reason) => reason.code), availabilityPolicies.map(() => "POLICY_SOURCE_VALIDATED"));
});

test("engine returns deterministic human-readable reason codes", () => {
  const engine = createAvailabilityEngine({ registry: cloneRegistry(), evaluationDate: "2026-08-26" });
  const result = engine.evaluate({ purpose: "research_availability" });
  assert.equal(result.available, true);
  assert.deepEqual(result.reasonCodes.map(({ code }) => code), ["RESEARCH_ONLY_BOUNDARY_CONFIRMED", "AVAILABILITY_RESEARCH_ALLOWED", "HUMAN_REVIEW_REQUIRED"]);
  assert.ok(result.reasonCodes.every(({ message }) => message.length > 0));
});

test("engine blocks prohibited purposes", () => {
  const engine = createAvailabilityEngine({ registry: cloneRegistry(), evaluationDate: "2026-08-26" });
  const result = engine.evaluate({ purposes: ["research_availability", "payment_initiation", "custody"] });
  assert.equal(result.available, false);
  assert.deepEqual(result.reasonCodes.map(({ code }) => code), ["PAYMENT_INITIATION_BLOCKED", "CUSTODY_BLOCKED", "AVAILABILITY_RESEARCH_ALLOWED", "HUMAN_REVIEW_REQUIRED"]);
});

test("startup rejects missing, expired, unvalidated, or unapproved evidence", () => {
  const cases = [
    [(registry) => { registry.sources = registry.sources.filter((source) => source.id !== "research-purpose-taxonomy-2026-08"); }, "EVIDENCE_SOURCE_MISSING"],
    [(registry) => { registry.sources[1].expiresAt = "2026-08-25"; }, "EVIDENCE_SOURCE_EXPIRED"],
    [(registry) => { registry.sources[1].status = "fixture"; }, "EVIDENCE_SOURCE_UNVALIDATED"],
    [(registry) => { registry.sources[1].stewardApproval = { approved: false }; }, "EVIDENCE_FIXTURE_REQUIRES_STEWARD_APPROVAL"],
  ];

  for (const [mutate, expectedCode] of cases) {
    const registry = cloneRegistry();
    mutate(registry);
    assert.throws(
      () => createAvailabilityEngine({ registry, evaluationDate: "2026-08-26" }),
      (error) => {
        assert.ok(error instanceof EvidenceValidationError);
        assert.deepEqual(reasonCodes(error), [expectedCode]);
        return true;
      },
    );
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { reviewedCases, sameDayAccuracyGate, scoreReviewedReplays, validateReviewedCase } from "../src/reviewed-replay.mjs";
import { scenarioMatrix } from "../src/replay.mjs";

const scenario = (id) => scenarioMatrix.scenarios.find((item) => item.id === id);

const syntheticReviewedCase = (scenarioId, overrides = {}) => {
  const item = scenario(scenarioId);
  return {
    schemaVersion: "1.0.0",
    policyVersion: item.policyVersion,
    id: `synthetic-reviewed-${item.id}`,
    description: `Synthetic test-only reviewed case for ${item.id}.`,
    evaluationTimestamp: item.evaluationTimestamp,
    redactedNormalizedInput: item.normalizedInput,
    humanReview: { status: "approved", reviewerId: "synthetic-human-steward", reviewedAt: "2026-08-27T00:00:00.000Z" },
    evidenceIds: item.evidenceIds,
    evidenceRequirements: item.evidenceRequirements,
    evidenceDates: item.evidenceRequirements.map((requirement) => ({ id: requirement.id, scope: requirement.scope })),
    expected: {
      creditedStatus: item.expected.creditedStatus,
      tradableStatus: item.expected.tradableStatus,
      externallyTransferableStatus: item.expected.externallyTransferableStatus,
      sameDayClassification: item.expected.eta.startsWith("same_day"),
      eta: item.expected.eta,
      reasonCodes: item.expected.reasonCodes,
      holdRisk: item.expected.holdRisk,
      confidence: item.expected.confidence,
      rejectedRoutes: item.expected.rejectedRoutes,
      fallback: item.expected.fallback,
    },
    sourceProvenance: "Synthetic test-only redacted replay fixture using public scenario labels only.",
    ...overrides,
  };
};

test("default reviewed registry has zero approved real-world cases", () => {
  const report = scoreReviewedReplays(reviewedCases);
  assert.equal(report.counts.total, 0);
  assert.equal(report.gate.threshold, sameDayAccuracyGate);
  assert.equal(report.gate.status, "insufficient-reviewed-cases");
  assert.equal(report.gate.accuracy, null);
});

test("reviewed cases require approval, reviewer, timestamp, provenance, evidence dates, and expected classification", () => {
  const invalid = syntheticReviewedCase("scenario-001-fully-available-same-day", {
    humanReview: { status: "pending", reviewerId: "", reviewedAt: "not-fixed" },
    sourceProvenance: "",
    evidenceDates: [],
    expected: {},
  });
  const codes = validateReviewedCase(invalid).reasonCodes.map((reason) => reason.code);
  assert.ok(codes.includes("REVIEW_APPROVAL_MISSING"));
  assert.ok(codes.includes("REVIEW_REVIEWER_MISSING"));
  assert.ok(codes.includes("REVIEW_TIMESTAMP_INVALID"));
  assert.ok(codes.includes("REVIEW_PROVENANCE_MISSING"));
  assert.ok(codes.includes("REVIEW_EXPECTED_CLASSIFICATION_MISSING"));
  assert.ok(codes.includes("REVIEW_EVIDENCE_INVALID"));
});

test("invalid reviewed cases never enter the denominator", () => {
  const valid = syntheticReviewedCase("scenario-001-fully-available-same-day");
  const invalid = syntheticReviewedCase("scenario-005-after-cutoff-next-business-day", {
    humanReview: { status: "pending", reviewerId: "synthetic-human-steward", reviewedAt: "2026-08-27T00:00:00.000Z" },
  });
  const report = scoreReviewedReplays({ schemaVersion: "1.0.0", policyVersion: "2026.08.26", cases: [valid, invalid] });
  assert.equal(report.counts.accepted, 1);
  assert.equal(report.counts.rejected, 1);
  assert.equal(report.gate.denominator, 1);
});

test("accuracy and gate calculations are deterministic for synthetic fixtures", () => {
  const sameDay = syntheticReviewedCase("scenario-001-fully-available-same-day");
  const nextDay = syntheticReviewedCase("scenario-005-after-cutoff-next-business-day");
  const passing = scoreReviewedReplays({ schemaVersion: "1.0.0", policyVersion: "2026.08.26", cases: [sameDay, nextDay] });
  assert.equal(passing.counts.correct, 2);
  assert.equal(passing.gate.accuracy, 1);
  assert.equal(passing.gate.status, "passed_preliminary");

  const failing = scoreReviewedReplays({
    schemaVersion: "1.0.0",
    policyVersion: "2026.08.26",
    cases: [sameDay, syntheticReviewedCase("scenario-005-after-cutoff-next-business-day", { expected: { ...nextDay.expected, sameDayClassification: true } })],
  });
  assert.equal(failing.counts.correct, 1);
  assert.equal(failing.counts.incorrect, 1);
  assert.equal(failing.gate.accuracy, 0.5);
  assert.equal(failing.gate.status, "failed_preliminary");
});

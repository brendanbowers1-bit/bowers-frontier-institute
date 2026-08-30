import assert from "node:assert/strict";
import test from "node:test";

import {
  reviewedCases,
  sameDayAccuracyGate,
  scoreReviewedReplays,
  validateReviewedCase,
  reviewedReplaySchemaVersion,
  reviewedReplayProtocolVersion,
} from "../src/reviewed-replay.mjs";
import { hashInput, scenarioMatrix } from "../src/replay.mjs";

const scenario = (id) => scenarioMatrix.scenarios.find((item) => item.id === id);
const routeFor = (scenarioId) => structuredClone(scenario(scenarioId).normalizedInput.preferredRoute);

const inputFor = (scenarioId, route = routeFor(scenarioId)) => ({
  requestId: `rw-${scenarioId}`,
  purposes: ["research_availability"],
  preferredRoute: route,
});

const classificationToSameDay = (classification) => classification === "available";

const reviewedCase = ({
  id,
  scenarioId,
  engineClassification,
  stewardClassification,
  disagreementCategory = "none",
  redactionStatus = "redacted",
  reviewStatus = "approved",
  input = inputFor(scenarioId),
  replayHash = hashInput(input),
} = {}) => {
  const baseScenario = scenario(scenarioId);
  return {
    schemaVersion: reviewedReplaySchemaVersion,
    protocolVersion: reviewedReplayProtocolVersion,
    policyVersion: baseScenario.policyVersion,
    id,
    description: `Synthetic test-only reviewed case ${id}.`,
    evaluationTimestamp: baseScenario.evaluationTimestamp,
    evidenceAsOfTimestamp: "2026-08-22T00:00:00.000Z",
    evidenceCollectedAt: "2026-08-27T00:00:00.000Z",
    caseScope: {
      scenarioId,
      provider: "synthetic-provider",
      corridor: "synthetic-corridor",
      product: "synthetic-product",
    },
    redactedNormalizedInput: input,
    humanReview: {
      status: reviewStatus,
      reviewerId: "synthetic-human-steward",
      reviewedAt: "2026-08-28T00:00:00.000Z",
    },
    evidenceIds: baseScenario.evidenceIds,
    evidenceRequirements: baseScenario.evidenceRequirements,
    evidenceDates: baseScenario.evidenceRequirements.map((requirement) => ({
      id: requirement.id,
      scope: requirement.scope,
      asOf: "2026-08-22",
    })),
    evidenceFreshness: {
      status: "current",
      stalenessDays: 5,
    },
    engine: {
      classification: engineClassification,
      rationale: "Synthetic engine rationale for test-only review fixture.",
      evidenceReferences: baseScenario.evidenceIds,
      version: {
        policyVersion: baseScenario.policyVersion,
        commitSha: "test-fixture-commit",
      },
    },
    humanSteward: {
      classification: stewardClassification,
      rationale: "Synthetic steward rationale for test-only review fixture.",
    },
    expected: {
      creditedStatus: input.preferredRoute.creditedStatus,
      tradableStatus: input.preferredRoute.tradableStatus,
      externallyTransferableStatus: input.preferredRoute.externallyTransferableStatus,
      sameDayClassification: classificationToSameDay(stewardClassification),
      eta: input.preferredRoute.eta,
      reasonCodes: input.preferredRoute.reasonCodes,
      holdRisk: input.preferredRoute.holdRisk,
      confidence: input.preferredRoute.confidence,
      rejectedRoutes: [],
      fallback: null,
    },
    sourceProvenance: "Synthetic test-only redacted replay fixture using public scenario labels only.",
    disagreementCategory,
    redactionStatus,
    sameDayAgreementResult: engineClassification === stewardClassification ? "agree" : "disagree",
    deterministicReplay: {
      id: `${id}:${replayHash.slice(7, 19)}`,
      inputHash: replayHash,
    },
    freezeStatus: "frozen",
  };
};

const abstainInput = (scenarioId) => {
  const route = routeFor(scenarioId);
  route.creditedStatus = "fail_closed";
  route.tradableStatus = "fail_closed";
  route.externallyTransferableStatus = "fail_closed";
  route.eta = "unavailable_pending_human_review";
  route.finality = "not_assessed";
  route.holdRisk = "unknown";
  route.confidence = 0;
  route.reasonCodes = ["FAIL_CLOSED_EVIDENCE"];
  return inputFor(scenarioId, route);
};

test("default reviewed registry has zero approved real-world cases", () => {
  const report = scoreReviewedReplays(reviewedCases);
  assert.equal(report.counts.total, 0);
  assert.equal(report.gate.threshold, sameDayAccuracyGate);
  assert.equal(report.gate.status, "insufficient-reviewed-cases");
  assert.equal(report.gate.accuracy, null);
  assert.equal(report.metrics.reviewedCaseCount, 0);
});

test("reviewed fixtures cover abstention, agreement, and disagreement metrics", () => {
  const cases = [
    reviewedCase({
      id: "test-engine-abstain-human-available",
      scenarioId: "scenario-001-fully-available-same-day",
      input: abstainInput("scenario-001-fully-available-same-day"),
      engineClassification: "abstain",
      stewardClassification: "available",
      disagreementCategory: "engine_abstained",
    }),
    reviewedCase({
      id: "test-engine-abstain-human-unavailable",
      scenarioId: "scenario-005-after-cutoff-next-business-day",
      input: abstainInput("scenario-005-after-cutoff-next-business-day"),
      engineClassification: "abstain",
      stewardClassification: "unavailable",
      disagreementCategory: "engine_abstained",
    }),
    reviewedCase({
      id: "test-false-available",
      scenarioId: "scenario-001-fully-available-same-day",
      engineClassification: "available",
      stewardClassification: "unavailable",
      disagreementCategory: "false_available",
    }),
    reviewedCase({
      id: "test-false-unavailable",
      scenarioId: "scenario-005-after-cutoff-next-business-day",
      engineClassification: "unavailable",
      stewardClassification: "available",
      disagreementCategory: "false_unavailable",
    }),
    reviewedCase({
      id: "test-agree-available",
      scenarioId: "scenario-001-fully-available-same-day",
      engineClassification: "available",
      stewardClassification: "available",
    }),
    reviewedCase({
      id: "test-agree-unavailable",
      scenarioId: "scenario-005-after-cutoff-next-business-day",
      engineClassification: "unavailable",
      stewardClassification: "unavailable",
    }),
    reviewedCase({
      id: "test-human-inconclusive",
      scenarioId: "scenario-001-fully-available-same-day",
      engineClassification: "available",
      stewardClassification: "inconclusive",
      disagreementCategory: "human_inconclusive",
    }),
  ];

  const report = scoreReviewedReplays({
    schemaVersion: reviewedReplaySchemaVersion,
    protocolVersion: reviewedReplayProtocolVersion,
    policyVersion: "2026.08.26",
    cases,
  });

  assert.equal(report.counts.accepted, 7);
  assert.equal(report.counts.correct, 2);
  assert.equal(report.counts.incorrect, 2);
  assert.equal(report.counts.indeterminate, 3);
  assert.equal(report.counts.abstained, 2);
  assert.equal(report.counts.falseAvailable, 1);
  assert.equal(report.counts.falseUnavailable, 1);
  assert.equal(report.gate.denominator, 4);
  assert.equal(report.metrics.falseAvailableRate, 0.25);
  assert.equal(report.metrics.falseUnavailableRate, 0.25);
  assert.equal(report.metrics.abstentionRate, 2 / 7);
  assert.equal(report.gate.status, "failed_preliminary_false_available");
  assert.equal(report.metrics.disagreementCategories.false_available, 1);
  assert.equal(report.metrics.disagreementCategories.false_unavailable, 1);
  assert.equal(report.metrics.disagreementCategories.engine_abstained, 2);
  assert.equal(report.metrics.disagreementCategories.human_inconclusive, 1);
  assert.deepEqual(report.metrics.breakdownsByScenarioProviderCorridor, {
    "scenario-001-fully-available-same-day|synthetic-provider|synthetic-corridor": 4,
    "scenario-005-after-cutoff-next-business-day|synthetic-provider|synthetic-corridor": 3,
  });
});

test("offline reviewed replay accepts frozen non-scenario route input", () => {
  const route = routeFor("scenario-001-fully-available-same-day");
  route.id = "cohort-1-frozen-real-world-route";
  const input = inputFor("scenario-001-fully-available-same-day", route);
  const frozenCase = reviewedCase({
    id: "test-frozen-real-world-route",
    scenarioId: "scenario-001-fully-available-same-day",
    input,
    engineClassification: "available",
    stewardClassification: "available",
  });
  frozenCase.caseScope.scenarioId = "cohort-1-real-world-category";

  const report = scoreReviewedReplays({
    schemaVersion: reviewedReplaySchemaVersion,
    protocolVersion: reviewedReplayProtocolVersion,
    policyVersion: "2026.08.26",
    cases: [frozenCase],
  });

  assert.equal(validateReviewedCase(frozenCase).ok, true);
  assert.equal(report.counts.accepted, 1);
  assert.equal(report.counts.correct, 1);
  assert.deepEqual(report.metrics.breakdownsByScenarioProviderCorridor, {
    "cohort-1-real-world-category|synthetic-provider|synthetic-corridor": 1,
  });
});

test("malformed, unapproved, unredacted, and hash-mismatched cases are rejected", () => {
  const valid = reviewedCase({
    id: "test-valid",
    scenarioId: "scenario-001-fully-available-same-day",
    engineClassification: "available",
    stewardClassification: "available",
  });
  const malformed = { id: "test-malformed" };
  const unapproved = reviewedCase({
    id: "test-unapproved",
    scenarioId: "scenario-001-fully-available-same-day",
    engineClassification: "available",
    stewardClassification: "available",
    reviewStatus: "pending",
  });
  const unredacted = reviewedCase({
    id: "test-unredacted",
    scenarioId: "scenario-001-fully-available-same-day",
    engineClassification: "available",
    stewardClassification: "available",
    redactionStatus: "unredacted",
  });
  const hashMismatch = reviewedCase({
    id: "test-hash-mismatch",
    scenarioId: "scenario-001-fully-available-same-day",
    engineClassification: "available",
    stewardClassification: "available",
    replayHash: "sha256:not-the-frozen-input-hash",
  });

  assert.equal(validateReviewedCase(valid).ok, true);
  for (const invalid of [malformed, unapproved, unredacted, hashMismatch]) {
    assert.equal(validateReviewedCase(invalid).ok, false);
  }

  const report = scoreReviewedReplays({
    schemaVersion: reviewedReplaySchemaVersion,
    protocolVersion: reviewedReplayProtocolVersion,
    policyVersion: "2026.08.26",
    cases: [valid, malformed, unapproved, unredacted, hashMismatch],
  });
  assert.equal(report.counts.accepted, 1);
  assert.equal(report.counts.rejected, 4);
  assert.equal(report.gate.denominator, 1);
});

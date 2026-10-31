import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { buildReason } from "./engine.mjs";
import {
  createDecisionRecord,
  deepFreeze,
  evidenceRegistry,
  hashInput,
  scenarioMatrix,
  validateReplayEvidence,
} from "./replay.mjs";
import { canonicalJson } from "./stable-json.mjs";

const reviewedCasesRegistry = JSON.parse(
  readFileSync(new URL("../data/reviewed-cases.json", import.meta.url), "utf8"),
);

export const reviewedReplaySchemaVersion = "real_world_case_v1";
export const reviewedReplayProtocolVersion = "2026.08.30";
export const sameDayAccuracyGate = 0.9;

const fixedTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const unsafeProvenancePattern =
  /(password|secret|api[_ -]?key|account number|routing number|ssn|social security|employer|customer id|wallet key|sk-)/i;
const allowedEngineClassifications = new Set(["available", "unavailable", "abstain"]);
const allowedStewardClassifications = new Set([
  "available",
  "unavailable",
  "inconclusive",
]);
const requiredScopeFields = ["scenarioId", "provider", "corridor", "product"];
const requiredExpectedFields = [
  "creditedStatus",
  "tradableStatus",
  "externallyTransferableStatus",
  "sameDayClassification",
  "eta",
  "reasonCodes",
  "holdRisk",
  "confidence",
  "rejectedRoutes",
  "fallback",
];
const requiredRouteFields = [
  "id",
  "purposes",
  "creditedStatus",
  "tradableStatus",
  "externallyTransferableStatus",
  "eta",
  "cost",
  "finality",
  "holdRisk",
  "confidence",
  "reasonCodes",
];

const addFailure = (failures, code, details = {}) => {
  failures.push(buildReason(code, details));
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const evidenceById = new Map(evidenceRegistry.sources.map((source) => [source.id, source]));

const assertFixedTimestamp = (failures, value, field, caseId) => {
  if (!fixedTimestampPattern.test(value ?? "")) {
    addFailure(failures, "REVIEW_TIMESTAMP_INVALID", { field, caseId });
  }
};

const validateRoute = (failures, route, field, caseId) => {
  if (!isPlainObject(route)) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field, caseId });
    return;
  }
  for (const routeField of requiredRouteFields) {
    if (!(routeField in route)) {
      addFailure(failures, "REVIEW_INPUT_INVALID", {
        field: `${field}.${routeField}`,
        caseId,
      });
    }
  }
  if (!Array.isArray(route.purposes) || !Array.isArray(route.reasonCodes)) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field, caseId });
  }
};

const validateFrozenInput = (failures, reviewedCase) => {
  const input = reviewedCase.redactedNormalizedInput;
  if (!isPlainObject(input)) {
    addFailure(failures, "REVIEW_INPUT_INVALID", {
      field: "redactedNormalizedInput",
      caseId: reviewedCase.id,
    });
    return;
  }
  if (!Array.isArray(input.purposes)) {
    addFailure(failures, "REVIEW_INPUT_INVALID", {
      field: "redactedNormalizedInput.purposes",
      caseId: reviewedCase.id,
    });
  }
  validateRoute(failures, input.preferredRoute, "redactedNormalizedInput.preferredRoute", reviewedCase.id);
  if (input.fallbackRoute) {
    validateRoute(failures, input.fallbackRoute, "redactedNormalizedInput.fallbackRoute", reviewedCase.id);
  }
};

const toScenario = (reviewedCase) => ({
  id: reviewedCase.id,
  description: reviewedCase.description,
  evaluationTimestamp: reviewedCase.evaluationTimestamp,
  policyVersion: reviewedCase.policyVersion,
  evidenceIds: reviewedCase.evidenceIds,
  evidenceRequirements: reviewedCase.evidenceRequirements,
  normalizedInput: reviewedCase.redactedNormalizedInput,
});

export const classifyDecisionRecord = (record) => {
  if (
    record.creditedStatus === "fail_closed" ||
    record.tradableStatus === "fail_closed" ||
    record.externallyTransferableStatus === "fail_closed" ||
    record.eta === "unavailable_pending_human_review"
  ) {
    return "abstain";
  }
  if (
    record.creditedStatus === "credited" &&
    record.tradableStatus === "tradable" &&
    record.externallyTransferableStatus === "externally_transferable" &&
    record.eta.startsWith("same_day")
  ) {
    return "available";
  }
  return "unavailable";
};

export const replayReviewedCase = (reviewedCase) =>
  createDecisionRecord({
    scenario: toScenario(reviewedCase),
    registry: evidenceRegistry,
    matrix: scenarioMatrix,
  });

export const validateReviewedCase = (reviewedCase) => {
  const failures = [];
  const caseId = reviewedCase?.id;

  if (reviewedCase?.schemaVersion !== reviewedReplaySchemaVersion) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "schemaVersion", caseId });
  }
  if (reviewedCase?.protocolVersion !== reviewedReplayProtocolVersion) {
    addFailure(failures, "REVIEW_PROTOCOL_VERSION_INVALID", {
      field: "protocolVersion",
      caseId,
    });
  }
  if (typeof caseId !== "string" || caseId.length === 0) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "id", caseId });
  }
  assertFixedTimestamp(failures, reviewedCase?.evaluationTimestamp, "evaluationTimestamp", caseId);
  assertFixedTimestamp(failures, reviewedCase?.evidenceAsOfTimestamp, "evidenceAsOfTimestamp", caseId);
  assertFixedTimestamp(failures, reviewedCase?.evidenceCollectedAt, "evidenceCollectedAt", caseId);
  assertFixedTimestamp(failures, reviewedCase?.humanReview?.reviewedAt, "humanReview.reviewedAt", caseId);

  for (const field of requiredScopeFields) {
    if (typeof reviewedCase?.caseScope?.[field] !== "string" || reviewedCase.caseScope[field].length === 0) {
      addFailure(failures, "REVIEW_INPUT_INVALID", { field: `caseScope.${field}`, caseId });
    }
  }

  validateFrozenInput(failures, reviewedCase ?? {});

  if (!Array.isArray(reviewedCase?.evidenceIds) || reviewedCase.evidenceIds.length === 0) {
    addFailure(failures, "REVIEW_EVIDENCE_INVALID", { field: "evidenceIds", caseId });
  } else {
    for (const evidenceId of reviewedCase.evidenceIds) {
      if (!evidenceById.has(evidenceId)) {
        addFailure(failures, "REVIEW_EVIDENCE_INVALID", { field: "evidenceIds", evidenceId, caseId });
      }
    }
  }
  if (!Array.isArray(reviewedCase?.evidenceRequirements) || reviewedCase.evidenceRequirements.length === 0) {
    addFailure(failures, "REVIEW_EVIDENCE_INVALID", {
      field: "evidenceRequirements",
      caseId,
    });
  }
  if (!Array.isArray(reviewedCase?.evidenceDates) || reviewedCase.evidenceDates.length === 0) {
    addFailure(failures, "REVIEW_EVIDENCE_INVALID", { field: "evidenceDates", caseId });
  }
  if (!isPlainObject(reviewedCase?.evidenceFreshness)) {
    addFailure(failures, "REVIEW_EVIDENCE_INVALID", { field: "evidenceFreshness", caseId });
  }

  if (reviewedCase?.humanReview?.status !== "approved") {
    addFailure(failures, "REVIEW_APPROVAL_MISSING", { caseId });
  }
  if (typeof reviewedCase?.humanReview?.reviewerId !== "string" || reviewedCase.humanReview.reviewerId.length === 0) {
    addFailure(failures, "REVIEW_REVIEWER_MISSING", { caseId });
  }
  if (typeof reviewedCase?.sourceProvenance !== "string" || reviewedCase.sourceProvenance.length === 0) {
    addFailure(failures, "REVIEW_PROVENANCE_MISSING", { caseId });
  } else if (unsafeProvenancePattern.test(reviewedCase.sourceProvenance)) {
    addFailure(failures, "REVIEW_PROVENANCE_UNSAFE", { caseId });
  }

  if (reviewedCase?.redactionStatus !== "redacted") {
    addFailure(failures, "REVIEW_REDACTION_INVALID", {
      field: "redactionStatus",
      caseId,
    });
  }
  if (reviewedCase?.freezeStatus !== "frozen") {
    addFailure(failures, "REVIEW_FREEZE_INVALID", { field: "freezeStatus", caseId });
  }

  if (!allowedEngineClassifications.has(reviewedCase?.engine?.classification)) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "engine.classification", caseId });
  }
  if (
    typeof reviewedCase?.engine?.rationale !== "string" ||
    !Array.isArray(reviewedCase?.engine?.evidenceReferences) ||
    typeof reviewedCase?.engine?.version?.policyVersion !== "string" ||
    typeof reviewedCase?.engine?.version?.commitSha !== "string"
  ) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "engine", caseId });
  }
  if (!allowedStewardClassifications.has(reviewedCase?.humanSteward?.classification)) {
    addFailure(failures, "REVIEW_INPUT_INVALID", {
      field: "humanSteward.classification",
      caseId,
    });
  }
  if (typeof reviewedCase?.humanSteward?.rationale !== "string") {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "humanSteward.rationale", caseId });
  }
  if (typeof reviewedCase?.disagreementCategory !== "string") {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "disagreementCategory", caseId });
  }
  if (typeof reviewedCase?.sameDayAgreementResult !== "string") {
    addFailure(failures, "REVIEW_INPUT_INVALID", {
      field: "sameDayAgreementResult",
      caseId,
    });
  }

  for (const field of requiredExpectedFields) {
    if (!(field in (reviewedCase?.expected ?? {}))) {
      addFailure(failures, "REVIEW_INPUT_INVALID", { field: `expected.${field}`, caseId });
    }
  }
  if (typeof reviewedCase?.expected?.sameDayClassification !== "boolean") {
    addFailure(failures, "REVIEW_EXPECTED_CLASSIFICATION_MISSING", { caseId });
  }

  const expectedHash = reviewedCase?.deterministicReplay?.inputHash;
  if (typeof expectedHash !== "string" || expectedHash !== hashInput(reviewedCase?.redactedNormalizedInput)) {
    addFailure(failures, "REVIEW_REPLAY_HASH_MISMATCH", {
      field: "deterministicReplay.inputHash",
      caseId,
    });
  }
  if (typeof reviewedCase?.deterministicReplay?.id !== "string") {
    addFailure(failures, "REVIEW_INPUT_INVALID", {
      field: "deterministicReplay.id",
      caseId,
    });
  }

  if (failures.length === 0) {
    const evidenceValidation = validateReplayEvidence({ scenario: toScenario(reviewedCase) });
    if (!evidenceValidation.ok) {
      addFailure(failures, "REVIEW_EVIDENCE_INVALID", {
        caseId,
        evidenceFailures: evidenceValidation.reasonCodes.map((reason) => reason.code),
      });
    }
  }

  if (failures.length === 0) {
    const replay = replayReviewedCase(reviewedCase);
    const replayClassification = classifyDecisionRecord(replay);
    if (reviewedCase.engine.classification !== replayClassification) {
      addFailure(failures, "REVIEW_ENGINE_MISMATCH", {
        caseId,
        expected: reviewedCase.engine.classification,
        actual: replayClassification,
      });
    }
  }

  return deepFreeze({ ok: failures.length === 0, reasonCodes: failures });
};

const countKey = (object, key) => {
  object[key] = (object[key] ?? 0) + 1;
};

export const scoreReviewedReplays = (registry = reviewedCasesRegistry) => {
  const cases = registry.cases ?? [];
  const acceptedCases = [];
  const rejectedCases = [];
  let correct = 0;
  let incorrect = 0;
  let indeterminate = 0;
  let abstained = 0;
  let falseAvailable = 0;
  let falseUnavailable = 0;
  const disagreementCategories = {};
  const breakdowns = {};

  for (const reviewedCase of cases) {
    const validation = validateReviewedCase(reviewedCase);
    if (!validation.ok) {
      rejectedCases.push({
        caseId: reviewedCase.id ?? "unknown",
        reasonCodes: validation.reasonCodes,
      });
      continue;
    }

    const record = replayReviewedCase(reviewedCase);
    const engineClassification = classifyDecisionRecord(record);
    const stewardClassification = reviewedCase.humanSteward.classification;
    const breakdownKey = [
      reviewedCase.caseScope.scenarioId,
      reviewedCase.caseScope.provider,
      reviewedCase.caseScope.corridor,
    ].join("|");
    countKey(breakdowns, breakdownKey);

    acceptedCases.push({
      caseId: reviewedCase.id,
      engineClassification,
      humanStewardClassification: stewardClassification,
      deterministicReplayId: reviewedCase.deterministicReplay.id,
      inputHash: reviewedCase.deterministicReplay.inputHash,
    });

    if (engineClassification === "abstain") {
      abstained += 1;
      indeterminate += 1;
      countKey(disagreementCategories, "engine_abstained");
      continue;
    }
    if (stewardClassification === "inconclusive") {
      indeterminate += 1;
      countKey(disagreementCategories, "human_inconclusive");
      continue;
    }
    if (engineClassification === stewardClassification) {
      correct += 1;
      continue;
    }

    incorrect += 1;
    countKey(disagreementCategories, reviewedCase.disagreementCategory);
    if (engineClassification === "available" && stewardClassification === "unavailable") {
      falseAvailable += 1;
    }
    if (engineClassification === "unavailable" && stewardClassification === "available") {
      falseUnavailable += 1;
    }
  }

  const denominator = correct + incorrect;
  const accuracy = denominator > 0 ? correct / denominator : null;
  const gateStatus =
    denominator === 0
      ? "insufficient-reviewed-cases"
      : falseAvailable > 0
        ? "failed_preliminary_false_available"
        : accuracy >= sameDayAccuracyGate
          ? "passed_preliminary"
          : "failed_preliminary";

  return deepFreeze({
    schemaVersion: reviewedReplaySchemaVersion,
    protocolVersion: reviewedReplayProtocolVersion,
    policyVersion: registry.policyVersion,
    gate: {
      metric: "same_day_classification_accuracy",
      threshold: sameDayAccuracyGate,
      status: gateStatus,
      accuracy,
      denominator,
      note:
        "Preliminary until a human-approved minimum reviewed sample size is established.",
    },
    metrics: {
      reviewedCaseCount: acceptedCases.length,
      sameDayAgreementRate: accuracy,
      abstentionRate: acceptedCases.length > 0 ? abstained / acceptedCases.length : null,
      falseAvailableRate: denominator > 0 ? falseAvailable / denominator : null,
      falseUnavailableRate: denominator > 0 ? falseUnavailable / denominator : null,
      insufficientEvidenceRate: acceptedCases.length > 0 ? abstained / acceptedCases.length : null,
      disagreementCategories,
      breakdownsByScenarioProviderCorridor: breakdowns,
    },
    counts: {
      total: cases.length,
      accepted: acceptedCases.length,
      rejected: rejectedCases.length,
      correct,
      incorrect,
      indeterminate,
      abstained,
      falseAvailable,
      falseUnavailable,
    },
    acceptedCases,
    rejectedCases,
  });
};

export const reviewedCases = deepFreeze(reviewedCasesRegistry);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(canonicalJson(scoreReviewedReplays()));
}

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { evaluateAvailability, normalizeEvaluationInput } from "./application.mjs";
import { buildReason } from "./engine.mjs";
import { deepFreeze, validateReplayEvidence } from "./replay.mjs";
import { canonicalJson } from "./stable-json.mjs";

const reviewedCasesRegistry = JSON.parse(readFileSync(new URL("../data/reviewed-cases.json", import.meta.url), "utf8"));
export const sameDayAccuracyGate = 0.9;

const fixedTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const unsafeProvenancePattern = /(password|secret|api[_ -]?key|account number|routing number|ssn|social security|employer|customer id|sk-)/i;
export const reviewedReplaySchemaVersion = "real_world_case_v1";

const requiredExpectedFields = ["creditedStatus", "tradableStatus", "externallyTransferableStatus", "sameDayClassification", "eta", "reasonCodes", "holdRisk", "confidence", "rejectedRoutes", "fallback"];
const requiredScopeFields = ["scenarioId", "provider", "corridor", "product"];

const addFailure = (failures, code, details = {}) => {
  failures.push(buildReason(code, details));
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

const toEvaluationInput = (reviewedCase) => ({
  scenarioId: reviewedCase.caseScope?.scenarioId ?? reviewedCase.id,
  description: reviewedCase.description,
  evaluationTimestamp: reviewedCase.evaluationTimestamp,
  policyVersion: reviewedCase.policyVersion,
  evidenceIds: reviewedCase.evidenceIds,
  evidenceRequirements: reviewedCase.evidenceRequirements,
  normalizedInput: reviewedCase.redactedNormalizedInput,
});

export const validateReviewedCase = (reviewedCase) => {
  const failures = [];
  if (reviewedCase?.schemaVersion !== reviewedReplaySchemaVersion) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "schemaVersion", caseId: reviewedCase?.id });
  }
  if (!fixedTimestampPattern.test(reviewedCase?.evaluationTimestamp ?? "")) {
    addFailure(failures, "MISSING_OR_INVALID_EVALUATION_TIMESTAMP", { field: "evaluationTimestamp", caseId: reviewedCase?.id });
  }
  if (reviewedCase?.humanReview?.status !== "approved") {
    addFailure(failures, "REVIEW_APPROVAL_MISSING", { caseId: reviewedCase?.id });
  }
  if (typeof reviewedCase?.humanReview?.reviewerId !== "string" || reviewedCase.humanReview.reviewerId.length === 0) {
    addFailure(failures, "REVIEW_REVIEWER_MISSING", { caseId: reviewedCase?.id });
  }
  if (!fixedTimestampPattern.test(reviewedCase?.humanReview?.reviewedAt ?? "")) {
    addFailure(failures, "REVIEW_TIMESTAMP_INVALID", { field: "humanReview.reviewedAt", caseId: reviewedCase?.id });
  }
  if (typeof reviewedCase?.sourceProvenance !== "string" || reviewedCase.sourceProvenance.length === 0) {
    addFailure(failures, "REVIEW_PROVENANCE_MISSING", { caseId: reviewedCase?.id });
  } else if (unsafeProvenancePattern.test(reviewedCase.sourceProvenance)) {
    addFailure(failures, "REVIEW_PROVENANCE_UNSAFE", { caseId: reviewedCase?.id });
  }
  if (typeof reviewedCase?.expected?.sameDayClassification !== "boolean") {
    addFailure(failures, "REVIEW_EXPECTED_CLASSIFICATION_MISSING", { caseId: reviewedCase?.id });
  }
  for (const field of requiredExpectedFields) {
    if (!(field in (reviewedCase?.expected ?? {}))) {
      addFailure(failures, "REVIEW_INPUT_INVALID", { field: `expected.${field}`, caseId: reviewedCase?.id });
    }
  }
  if (!Array.isArray(reviewedCase?.evidenceDates) || reviewedCase.evidenceDates.length === 0) {
    addFailure(failures, "REVIEW_EVIDENCE_INVALID", { field: "evidenceDates", caseId: reviewedCase?.id });
  }
  for (const field of requiredScopeFields) {
    if (typeof reviewedCase?.caseScope?.[field] !== "string" || reviewedCase.caseScope[field].length === 0) {
      addFailure(failures, "REVIEW_INPUT_INVALID", { field: `caseScope.${field}`, caseId: reviewedCase?.id });
    }
  }
  if (typeof reviewedCase?.engine?.classification !== "string" || !Array.isArray(reviewedCase?.engine?.evidenceReferences)) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "engine", caseId: reviewedCase?.id });
  }
  if (typeof reviewedCase?.humanSteward?.classification !== "string" || typeof reviewedCase?.humanSteward?.rationale !== "string") {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "humanSteward", caseId: reviewedCase?.id });
  }
  if (typeof reviewedCase?.disagreementCategory !== "string") {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "disagreementCategory", caseId: reviewedCase?.id });
  }
  if (reviewedCase?.redactionStatus !== "redacted") {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "redactionStatus", caseId: reviewedCase?.id });
  }
  if (typeof reviewedCase?.sameDayAgreementResult !== "string") {
    addFailure(failures, "REVIEW_INPUT_INVALID", { field: "sameDayAgreementResult", caseId: reviewedCase?.id });
  }
  try {
    normalizeEvaluationInput(toEvaluationInput(reviewedCase));
  } catch (error) {
    addFailure(failures, "REVIEW_INPUT_INVALID", { caseId: reviewedCase?.id, detail: error.code ?? error.message });
  }
  if (failures.length === 0) {
    const evidenceValidation = validateReplayEvidence({ scenario: toScenario(reviewedCase) });
    if (!evidenceValidation.ok) {
      addFailure(failures, "REVIEW_EVIDENCE_INVALID", {
        caseId: reviewedCase.id,
        evidenceFailures: evidenceValidation.reasonCodes.map((reason) => reason.code),
      });
    }
  }
  return deepFreeze({ ok: failures.length === 0, reasonCodes: failures });
};

const classifySameDay = (record) => {
  if (record.creditedStatus === "fail_closed" || record.tradableStatus === "fail_closed" || record.externallyTransferableStatus === "fail_closed") {
    return null;
  }
  return record.eta.startsWith("same_day");
};

export const scoreReviewedReplays = (registry = reviewedCasesRegistry) => {
  const cases = registry.cases ?? [];
  const acceptedCases = [];
  const rejectedCases = [];
  let correct = 0;
  let incorrect = 0;
  let indeterminate = 0;
  let falseAvailable = 0;
  let falseUnavailable = 0;
  const disagreementCategories = {};
  const breakdowns = {};

  for (const reviewedCase of cases) {
    const validation = validateReviewedCase(reviewedCase);
    if (!validation.ok) {
      rejectedCases.push({ caseId: reviewedCase.id ?? "unknown", reasonCodes: validation.reasonCodes });
      continue;
    }
    const record = evaluateAvailability(toEvaluationInput(reviewedCase));
    const actualSameDay = classifySameDay(record);
    acceptedCases.push({
      caseId: reviewedCase.id,
      actualSameDayClassification: actualSameDay,
      expectedSameDayClassification: reviewedCase.expected.sameDayClassification,
      decisionId: record.decisionId,
    });
    const breakdownKey = [
      reviewedCase.caseScope.scenarioId,
      reviewedCase.caseScope.provider,
      reviewedCase.caseScope.corridor,
    ].join("|");
    breakdowns[breakdownKey] = (breakdowns[breakdownKey] ?? 0) + 1;

    if (actualSameDay === null) {
      indeterminate += 1;
    } else if (actualSameDay === reviewedCase.expected.sameDayClassification) {
      correct += 1;
    } else {
      incorrect += 1;
      disagreementCategories[reviewedCase.disagreementCategory] = (disagreementCategories[reviewedCase.disagreementCategory] ?? 0) + 1;
      if (actualSameDay === true) falseAvailable += 1;
      if (actualSameDay === false) falseUnavailable += 1;
    }
  }

  const denominator = correct + incorrect;
  const accuracy = denominator > 0 ? correct / denominator : null;
  const gateStatus = denominator === 0 ? "insufficient-reviewed-cases" : accuracy >= sameDayAccuracyGate ? "passed_preliminary" : "failed_preliminary";
  return deepFreeze({
    schemaVersion: reviewedReplaySchemaVersion,
    policyVersion: registry.policyVersion,
    gate: {
      metric: "same_day_classification_accuracy",
      threshold: sameDayAccuracyGate,
      status: gateStatus,
      accuracy,
      denominator,
      note: "Preliminary until a human-approved minimum reviewed sample size is established.",
    },
    metrics: {
      reviewedCaseCount: acceptedCases.length,
      sameDayAgreementRate: accuracy,
      abstentionRate: acceptedCases.length > 0 ? indeterminate / acceptedCases.length : null,
      falseAvailableRate: denominator > 0 ? falseAvailable / denominator : null,
      falseUnavailableRate: denominator > 0 ? falseUnavailable / denominator : null,
      insufficientEvidenceRate: acceptedCases.length > 0 ? indeterminate / acceptedCases.length : null,
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
    },
    acceptedCases,
    rejectedCases,
  });
};

export const reviewedCases = deepFreeze(reviewedCasesRegistry);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(canonicalJson(scoreReviewedReplays()));
}

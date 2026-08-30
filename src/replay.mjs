import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { buildReason, createAvailabilityEngine, validatePolicyEvidence, EvidenceValidationError } from "./engine.mjs";
import { availabilityPolicies, policySourceStatuses, policyVersion } from "./policies.mjs";
import { canonicalStringify } from "./stable-json.mjs";

const defaultEvidenceRegistry = JSON.parse(readFileSync(new URL("../data/evidence.json", import.meta.url), "utf8"));
const defaultScenarioMatrix = JSON.parse(readFileSync(new URL("../data/scenarios.json", import.meta.url), "utf8"));

const blockedReasonCodes = new Set([
  "PAYMENT_INITIATION_BLOCKED",
  "CUSTODY_BLOCKED",
  "CREDENTIAL_COLLECTION_BLOCKED",
  "AUTONOMOUS_COMPLIANCE_BLOCKED",
  "UNSUPPORTED_PRODUCTION_CLAIM_BLOCKED",
]);

const failClosedStatuses = Object.freeze({
  creditedStatus: "fail_closed",
  tradableStatus: "fail_closed",
  externallyTransferableStatus: "fail_closed",
  eta: "unavailable_pending_human_review",
  cost: "not_assessed",
  finality: "not_assessed",
  holdRisk: "unknown",
  confidence: 0,
});

export const replaySchemaVersion = "1.0.0";

export const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
  }
  return value;
};

export const hashInput = (normalizedInput) =>
  `sha256:${createHash("sha256").update(canonicalStringify(normalizedInput)).digest("hex")}`;

const dateOnlyFromTimestamp = (timestamp) => {
  if (typeof timestamp !== "string") {
    throw new TypeError("Replay evaluation timestamp must be a string.");
  }
  const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  if (!match) {
    throw new TypeError(`Replay evaluation timestamp must be fixed UTC ISO-8601, received ${timestamp}.`);
  }
  return match[1];
};

const parseDate = (date) => new Date(`${date}T00:00:00.000Z`);
const freshnessFor = (source, evaluationDate) => {
  const evaluatedAt = parseDate(evaluationDate);
  if (parseDate(source.asOf) > evaluatedAt) return "future";
  if (parseDate(source.expiresAt) < evaluatedAt) return "expired";
  return "current";
};

const sourcesById = (registry) => new Map((registry.sources ?? []).map((source) => [source.id, source]));

const addFailure = (failures, reason, seen) => {
  const key = [reason.code, reason.policyId ?? "", reason.sourceId ?? "", reason.scope ?? ""].join(":");
  if (!seen.has(key)) {
    seen.add(key);
    failures.push(reason);
  }
};

export const validateReplayEvidence = ({
  scenario,
  registry = defaultEvidenceRegistry,
  policies = availabilityPolicies,
} = {}) => {
  const evaluationDate = dateOnlyFromTimestamp(scenario.evaluationTimestamp);
  const failures = [];
  const seen = new Set();

  try {
    const policyEvidence = validatePolicyEvidence(policies, registry, evaluationDate);
    if (!policyEvidence.ok) {
      for (const reason of policyEvidence.reasonCodes) addFailure(failures, reason, seen);
    }
  } catch (error) {
    if (!(error instanceof EvidenceValidationError)) throw error;
    for (const reason of error.reasonCodes) addFailure(failures, reason, seen);
  }

  const sources = sourcesById(registry);
  for (const requirement of scenario.evidenceRequirements ?? []) {
    const source = sources.get(requirement.id);
    if (!source) {
      addFailure(failures, buildReason("EVIDENCE_SOURCE_MISSING", {
        sourceId: requirement.id,
        scope: requirement.scope,
        scenarioId: scenario.id,
      }), seen);
      continue;
    }

    if (source.status !== policySourceStatuses.VALIDATED) {
      addFailure(failures, buildReason("EVIDENCE_SOURCE_UNVALIDATED", {
        sourceId: source.id,
        status: source.status,
        scope: requirement.scope,
        scenarioId: scenario.id,
      }), seen);
    }

    const freshness = freshnessFor(source, evaluationDate);
    if (freshness === "future") {
      addFailure(failures, buildReason("EVIDENCE_SOURCE_AS_OF_IN_FUTURE", {
        sourceId: source.id,
        asOf: source.asOf,
        scope: requirement.scope,
        scenarioId: scenario.id,
      }), seen);
    }
    if (freshness === "expired") {
      addFailure(failures, buildReason("EVIDENCE_SOURCE_EXPIRED", {
        sourceId: source.id,
        expiresAt: source.expiresAt,
        scope: requirement.scope,
        scenarioId: scenario.id,
      }), seen);
    }

    if (!source.scopes?.includes(requirement.scope)) {
      addFailure(failures, buildReason("EVIDENCE_SCOPE_MISMATCH", {
        sourceId: source.id,
        scope: requirement.scope,
        scenarioId: scenario.id,
      }), seen);
    }

    if (
      source.sourceKind === "synthetic_fixture" &&
      source.status === policySourceStatuses.VALIDATED &&
      source.stewardApproval?.approved !== true
    ) {
      addFailure(failures, buildReason("EVIDENCE_FIXTURE_REQUIRES_STEWARD_APPROVAL", {
        sourceId: source.id,
        scope: requirement.scope,
        scenarioId: scenario.id,
      }), seen);
    }

    if (
      scenario.normalizedInput?.claimedLiveProviderEvidence === true &&
      requirement.scope.startsWith("live_") &&
      source.sourceKind === "synthetic_fixture"
    ) {
      addFailure(failures, buildReason("EVIDENCE_CONFLICT_DETECTED", {
        sourceId: source.id,
        scope: requirement.scope,
        scenarioId: scenario.id,
      }), seen);
    }
  }

  return deepFreeze({ ok: failures.length === 0, reasonCodes: failures });
};

const buildEvidenceDates = (scenario, registry, evaluationDate) => {
  const sources = sourcesById(registry);
  return (scenario.evidenceRequirements ?? []).map((requirement) => {
    const source = sources.get(requirement.id);
    if (!source) {
      return {
        id: requirement.id,
        asOf: null,
        expiresAt: null,
        scope: requirement.scope,
        registryScopes: [],
        status: "missing",
        freshness: "missing",
      };
    }
    return {
      id: source.id,
      asOf: source.asOf,
      expiresAt: source.expiresAt,
      scope: source.scopes?.includes(requirement.scope) ? requirement.scope : source.scopes?.[0] ?? requirement.scope,
      registryScopes: source.scopes ?? [],
      status: source.status,
      freshness: freshnessFor(source, evaluationDate),
    };
  });
};

const routeReasonObjects = (route) =>
  (route.reasonCodes ?? []).map((code) => buildReason(code, { routeId: route.id }));

const evaluateRoute = ({ route, registry, evaluationDate }) => {
  const engine = createAvailabilityEngine({ registry, evaluationDate });
  const engineResult = engine.evaluate({ purposes: route.purposes });
  return {
    available: engineResult.available,
    engineReasonCodes: engineResult.reasonCodes,
    blockedReasons: engineResult.reasonCodes.filter((reason) => blockedReasonCodes.has(reason.code)),
  };
};

const buildBaseRecord = ({ matrix, scenario, registry, evidenceDates }) => ({
  decisionId: `${scenario.id}:${hashInput(scenario.normalizedInput).slice(7, 19)}`,
  scenarioId: scenario.id,
  schemaVersion: matrix.schemaVersion,
  policyVersion: scenario.policyVersion,
  evaluatedAt: scenario.evaluationTimestamp,
  normalizedInputHash: hashInput(scenario.normalizedInput),
  evidenceIds: [...scenario.evidenceIds],
  evidenceDates,
  registryVersion: registry.registryVersion,
});

const buildFailClosedRecord = ({ matrix, scenario, registry, evidenceDates, failures }) => {
  const failureCodes = failures.map((failure) => failure.code);
  return deepFreeze({
    ...buildBaseRecord({ matrix, scenario, registry, evidenceDates }),
    ...failClosedStatuses,
    reasonCodes: [buildReason("FAIL_CLOSED_EVIDENCE"), ...failures],
    rejectedRoutes: [{ routeId: scenario.normalizedInput.preferredRoute.id, reasonCodes: failureCodes }],
    fallback: null,
    evidenceValidationFailures: failures,
  });
};

const buildRouteRecord = ({ matrix, scenario, registry, evidenceDates, route, reasonCodes, rejectedRoutes = [], fallback = null }) =>
  deepFreeze({
    ...buildBaseRecord({ matrix, scenario, registry, evidenceDates }),
    creditedStatus: route.creditedStatus,
    tradableStatus: route.tradableStatus,
    externallyTransferableStatus: route.externallyTransferableStatus,
    eta: route.eta,
    cost: route.cost,
    finality: route.finality,
    holdRisk: route.holdRisk,
    confidence: route.confidence,
    reasonCodes,
    rejectedRoutes,
    fallback,
    evidenceValidationFailures: [],
  });

export const createDecisionRecord = ({
  scenario,
  registry = defaultEvidenceRegistry,
  matrix = defaultScenarioMatrix,
} = {}) => {
  const evaluationDate = dateOnlyFromTimestamp(scenario.evaluationTimestamp);
  const evidenceDates = buildEvidenceDates(scenario, registry, evaluationDate);
  const evidenceValidation = validateReplayEvidence({ scenario, registry });
  if (!evidenceValidation.ok) {
    return buildFailClosedRecord({ matrix, scenario, registry, evidenceDates, failures: evidenceValidation.reasonCodes });
  }

  const preferredRoute = scenario.normalizedInput.preferredRoute;
  const preferredResult = evaluateRoute({ route: preferredRoute, registry, evaluationDate });
  if (!preferredResult.available && scenario.normalizedInput.fallbackRoute) {
    const fallbackRoute = scenario.normalizedInput.fallbackRoute;
    const fallbackResult = evaluateRoute({ route: fallbackRoute, registry, evaluationDate });
    const rejectedRoutes = [{
      routeId: preferredRoute.id,
      reasonCodes: preferredResult.blockedReasons.map((reason) => reason.code),
    }];
    if (fallbackResult.available) {
      return buildRouteRecord({
        matrix,
        scenario,
        registry,
        evidenceDates,
        route: fallbackRoute,
        reasonCodes: [
          buildReason("REPLAY_EVIDENCE_VALIDATED"),
          ...preferredResult.blockedReasons,
          buildReason("PREFERRED_ROUTE_REJECTED", { routeId: preferredRoute.id }),
          ...fallbackResult.engineReasonCodes,
          ...routeReasonObjects(fallbackRoute),
          buildReason("FALLBACK_ROUTE_SELECTED", { routeId: fallbackRoute.id }),
        ],
        rejectedRoutes,
        fallback: { routeId: fallbackRoute.id, selected: true },
      });
    }
  }

  return buildRouteRecord({
    matrix,
    scenario,
    registry,
    evidenceDates,
    route: preferredRoute,
    reasonCodes: [
      buildReason("REPLAY_EVIDENCE_VALIDATED"),
      ...preferredResult.engineReasonCodes,
      ...routeReasonObjects(preferredRoute),
    ],
  });
};

export const validateReplayMatrixShape = (matrix = defaultScenarioMatrix) => {
  const scenarios = matrix.scenarios ?? [];
  const ids = new Set(scenarios.map((scenario) => scenario.id));
  return deepFreeze({
    ok: matrix.schemaVersion === replaySchemaVersion && matrix.policyVersion === policyVersion && scenarios.length === 10 && ids.size === scenarios.length,
    scenarioCount: scenarios.length,
    uniqueScenarioCount: ids.size,
  });
};

export const replayAllScenarios = ({ matrix = defaultScenarioMatrix, registry = defaultEvidenceRegistry } = {}) =>
  deepFreeze(matrix.scenarios.map((scenario) => createDecisionRecord({ scenario, registry, matrix })));

export const scenarioMatrix = deepFreeze(defaultScenarioMatrix);
export const evidenceRegistry = deepFreeze(defaultEvidenceRegistry);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(canonicalStringify(replayAllScenarios(), 2));
}

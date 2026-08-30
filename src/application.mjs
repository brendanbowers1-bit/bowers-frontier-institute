import {
  createDecisionRecord,
  evidenceRegistry,
  replayAllScenarios,
  scenarioMatrix,
} from "./replay.mjs";
import { canonicalJson } from "./stable-json.mjs";

export const applicationSchemaVersion = "1.0.0";
export const apiVersion = "v1";

export class ApplicationInputError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.name = "ApplicationInputError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const allowedTopLevelFields = new Set([
  "description",
  "evaluationTimestamp",
  "evidenceIds",
  "evidenceRequirements",
  "normalizedInput",
  "policyVersion",
  "scenarioId",
]);
const allowedNormalizedInputFields = new Set(["claimedLiveProviderEvidence", "fallbackRoute", "preferredRoute", "purposes", "requestId"]);
const allowedRouteFields = new Set(["confidence", "cost", "creditedStatus", "eta", "externallyTransferableStatus", "finality", "holdRisk", "id", "purposes", "reasonCodes", "tradableStatus"]);
const supportedRouteIds = new Set(
  scenarioMatrix.scenarios.flatMap((scenario) => [
    scenario.normalizedInput.preferredRoute.id,
    scenario.normalizedInput.fallbackRoute?.id,
  ]).filter(Boolean),
);
const registryEvidenceIds = new Set(evidenceRegistry.sources.map((source) => source.id));

export const responseMetadata = Object.freeze({
  apiVersion,
  applicationSchemaVersion,
  schemaVersion: scenarioMatrix.schemaVersion,
  policyVersion: scenarioMatrix.policyVersion,
  matrixVersion: scenarioMatrix.matrixVersion,
  evidenceRegistryVersion: evidenceRegistry.registryVersion,
  evidenceCheckedAt: evidenceRegistry.checkedAt,
  scenarioCount: scenarioMatrix.scenarios.length,
  researchOnly: true,
  readOnly: true,
  nonLive: true,
  nonTransactional: true,
  boundaries: Object.freeze([
    "no_custody",
    "no_payment_or_transfer_initiation",
    "no_credentials_or_secrets",
    "no_live_provider_connections",
    "no_kyc_aml_or_eligibility_decisions",
    "no_payment_or_settlement_guarantees",
    "no_employer_data_or_pii",
  ]),
});

const assertPlainObject = (value, code, field) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApplicationInputError(400, code, `${field} must be an object.`, { field });
  }
};

const rejectUnknownFields = (object, allowedFields, field) => {
  for (const key of Object.keys(object)) {
    if (!allowedFields.has(key)) {
      throw new ApplicationInputError(400, "UNSUPPORTED_FIELD", `${field}.${key} is not supported by the read-only API.`, { field: `${field}.${key}` });
    }
  }
};

const assertFixedTimestamp = (timestamp) => {
  if (typeof timestamp !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)) {
    throw new ApplicationInputError(400, "MISSING_OR_INVALID_EVALUATION_TIMESTAMP", "evaluationTimestamp must be a fixed UTC ISO-8601 timestamp.", { field: "evaluationTimestamp" });
  }
};

const assertStringArray = (value, code, field) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ApplicationInputError(400, code, `${field} must be an array of strings.`, { field });
  }
};

const assertEvidenceReferences = (input) => {
  assertStringArray(input.evidenceIds, "INVALID_EVIDENCE_REFERENCE", "evidenceIds");
  if (!Array.isArray(input.evidenceRequirements)) {
    throw new ApplicationInputError(400, "INVALID_EVIDENCE_REFERENCE", "evidenceRequirements must be an array.", { field: "evidenceRequirements" });
  }
  for (const id of input.evidenceIds) {
    if (!registryEvidenceIds.has(id)) {
      throw new ApplicationInputError(400, "INVALID_EVIDENCE_REFERENCE", `Evidence ID ${id} is not in the registry.`, { evidenceId: id });
    }
  }
  for (const requirement of input.evidenceRequirements) {
    assertPlainObject(requirement, "INVALID_EVIDENCE_REFERENCE", "evidenceRequirement");
    if (typeof requirement.id !== "string" || typeof requirement.scope !== "string") {
      throw new ApplicationInputError(400, "INVALID_EVIDENCE_REFERENCE", "Each evidence requirement must include id and scope strings.");
    }
    if (!registryEvidenceIds.has(requirement.id)) {
      throw new ApplicationInputError(400, "INVALID_EVIDENCE_REFERENCE", `Evidence requirement ${requirement.id} is not in the registry.`, { evidenceId: requirement.id });
    }
  }
};

const assertRoute = (route, field) => {
  assertPlainObject(route, "UNSUPPORTED_ROUTE", field);
  rejectUnknownFields(route, allowedRouteFields, field);
  if (!supportedRouteIds.has(route.id)) {
    throw new ApplicationInputError(400, "UNSUPPORTED_ROUTE", `Route ${route.id} is not supported by the deterministic replay matrix.`, { routeId: route.id });
  }
  assertStringArray(route.purposes, "UNSUPPORTED_ROUTE", `${field}.purposes`);
  assertStringArray(route.reasonCodes, "UNSUPPORTED_ROUTE", `${field}.reasonCodes`);
};

export const normalizeEvaluationInput = (input) => {
  assertPlainObject(input, "INVALID_EVALUATION_INPUT", "body");
  rejectUnknownFields(input, allowedTopLevelFields, "body");
  assertFixedTimestamp(input.evaluationTimestamp);
  assertEvidenceReferences(input);
  assertPlainObject(input.normalizedInput, "INVALID_EVALUATION_INPUT", "normalizedInput");
  rejectUnknownFields(input.normalizedInput, allowedNormalizedInputFields, "normalizedInput");
  assertStringArray(input.normalizedInput.purposes, "INVALID_EVALUATION_INPUT", "normalizedInput.purposes");
  assertRoute(input.normalizedInput.preferredRoute, "normalizedInput.preferredRoute");
  if (input.normalizedInput.fallbackRoute) {
    assertRoute(input.normalizedInput.fallbackRoute, "normalizedInput.fallbackRoute");
  }
  return {
    id: input.scenarioId ?? "ad-hoc-evaluation",
    description: input.description ?? "Ad hoc read-only availability evaluation.",
    evaluationTimestamp: input.evaluationTimestamp,
    policyVersion: input.policyVersion ?? scenarioMatrix.policyVersion,
    evidenceIds: [...input.evidenceIds],
    evidenceRequirements: input.evidenceRequirements.map((requirement) => ({
      id: requirement.id,
      scope: requirement.scope,
    })),
    normalizedInput: structuredClone(input.normalizedInput),
  };
};

export const evaluateAvailability = (input, { registry = evidenceRegistry } = {}) =>
  createDecisionRecord({ scenario: normalizeEvaluationInput(input), registry, matrix: scenarioMatrix });

const scenarioPublicView = (scenario) => ({
  id: scenario.id,
  description: scenario.description,
  evaluationTimestamp: scenario.evaluationTimestamp,
  policyVersion: scenario.policyVersion,
  evidenceIds: scenario.evidenceIds,
  evidenceRequirements: scenario.evidenceRequirements,
  normalizedInput: scenario.normalizedInput,
});

export const getMeta = () => ({ meta: responseMetadata });
export const listScenarios = () => ({ meta: responseMetadata, scenarios: scenarioMatrix.scenarios.map(scenarioPublicView) });
export const getScenario = (scenarioId) => {
  const scenario = scenarioMatrix.scenarios.find(({ id }) => id === scenarioId);
  if (!scenario) {
    throw new ApplicationInputError(404, "SCENARIO_NOT_FOUND", `Scenario ${scenarioId} was not found.`, { scenarioId });
  }
  return { meta: responseMetadata, scenario: scenarioPublicView(scenario) };
};
export const listReplayRecords = () => ({ meta: responseMetadata, replays: replayAllScenarios() });
export const getReplayRecord = (scenarioId) => {
  const scenario = scenarioMatrix.scenarios.find(({ id }) => id === scenarioId);
  if (!scenario) {
    throw new ApplicationInputError(404, "SCENARIO_NOT_FOUND", `Scenario ${scenarioId} was not found.`, { scenarioId });
  }
  return { meta: responseMetadata, replay: createDecisionRecord({ scenario, matrix: scenarioMatrix, registry: evidenceRegistry }) };
};

export const buildErrorEnvelope = (error) => ({
  meta: responseMetadata,
  error: {
    code: error.code ?? "INTERNAL_ERROR",
    message: error.message,
    details: error.details ?? {},
  },
});

export const buildStaticApiArtifacts = () => {
  const artifacts = new Map();
  const scenarios = listScenarios();
  const replays = listReplayRecords();
  artifacts.set("api/v1/meta.json", getMeta());
  artifacts.set("api/v1/scenarios.json", scenarios);
  artifacts.set("api/v1/replays.json", replays);
  for (const scenario of scenarios.scenarios) {
    artifacts.set(`api/v1/scenarios/${scenario.id}.json`, { meta: responseMetadata, scenario });
  }
  for (const replay of replays.replays) {
    artifacts.set(`api/v1/replays/${replay.scenarioId}.json`, { meta: responseMetadata, replay });
  }
  return artifacts;
};

export const stableApplicationJson = (value) => canonicalJson(value);

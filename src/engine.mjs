import { readFileSync } from "node:fs";

import { availabilityPolicies, reasonCatalog } from "./policies.mjs";

const evidenceRegistry = JSON.parse(
  readFileSync(new URL("../data/evidence.json", import.meta.url), "utf8"),
);

const blockedPurposeReasonCodes = Object.freeze({
  payment_initiation: "PAYMENT_INITIATION_BLOCKED",
  custody: "CUSTODY_BLOCKED",
  credential_collection: "CREDENTIAL_COLLECTION_BLOCKED",
  autonomous_compliance_decision: "AUTONOMOUS_COMPLIANCE_BLOCKED",
  unsupported_production_claim: "UNSUPPORTED_PRODUCTION_CLAIM_BLOCKED",
});

export class EvidenceValidationError extends Error {
  constructor(reasonCodes) {
    super(
      `Availability evidence validation failed: ${reasonCodes
        .map((reason) => reason.code)
        .join(", ")}`,
    );
    this.name = "EvidenceValidationError";
    this.reasonCodes = reasonCodes;
  }
}

export const buildReason = (code, details = {}) => ({
  code,
  message: reasonCatalog[code] ?? code,
  ...details,
});

const parseRegistryDate = (value, fieldName, sourceId) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new EvidenceValidationError([
      buildReason("EVIDENCE_SOURCE_MISSING_AS_OF", { field: fieldName, sourceId }),
    ]);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new EvidenceValidationError([
      buildReason("EVIDENCE_SOURCE_MISSING_AS_OF", { field: fieldName, sourceId }),
    ]);
  }
  return date;
};

const evidenceById = (registry) =>
  new Map((registry.sources ?? []).map((source) => [source.id, source]));

export const validatePolicyEvidence = (
  policies,
  registry,
  evaluationDate = registry.checkedAt,
) => {
  const sources = evidenceById(registry);
  const checkedAt = parseRegistryDate(evaluationDate, "evaluationDate", "registry");
  const reasonCodes = [];

  for (const policy of policies) {
    const source = sources.get(policy.sourceId);
    if (!source) {
      reasonCodes.push(buildReason("EVIDENCE_SOURCE_MISSING", {
        policyId: policy.id,
        sourceId: policy.sourceId,
      }));
      continue;
    }

    if (source.status !== policy.requiredSourceStatus) {
      reasonCodes.push(buildReason("EVIDENCE_SOURCE_UNVALIDATED", {
        policyId: policy.id,
        sourceId: policy.sourceId,
        status: source.status,
      }));
    }

    const asOf = parseRegistryDate(source.asOf, "asOf", source.id);
    if (asOf > checkedAt) {
      reasonCodes.push(buildReason("EVIDENCE_SOURCE_AS_OF_IN_FUTURE", {
        policyId: policy.id,
        sourceId: policy.sourceId,
        asOf: source.asOf,
        evaluationDate,
      }));
    }

    const expiresAt = parseRegistryDate(source.expiresAt, "expiresAt", source.id);
    if (expiresAt < checkedAt) {
      reasonCodes.push(buildReason("EVIDENCE_SOURCE_EXPIRED", {
        policyId: policy.id,
        sourceId: policy.sourceId,
        expiresAt: source.expiresAt,
        evaluationDate,
      }));
    }

    if (
      source.sourceKind === "synthetic_fixture" &&
      source.status === policy.requiredSourceStatus &&
      source.stewardApproval?.approved !== true
    ) {
      reasonCodes.push(buildReason("EVIDENCE_FIXTURE_REQUIRES_STEWARD_APPROVAL", {
        policyId: policy.id,
        sourceId: policy.sourceId,
      }));
    }
  }

  return {
    ok: reasonCodes.length === 0,
    reasonCodes: reasonCodes.length === 0
      ? policies.map((policy) =>
          buildReason("POLICY_SOURCE_VALIDATED", {
            policyId: policy.id,
            sourceId: policy.sourceId,
          }),
        )
      : reasonCodes,
  };
};

export const createAvailabilityEngine = ({
  policies = availabilityPolicies,
  registry = evidenceRegistry,
  evaluationDate = registry.checkedAt,
} = {}) => {
  const evidenceValidation = validatePolicyEvidence(policies, registry, evaluationDate);
  if (!evidenceValidation.ok) {
    throw new EvidenceValidationError(evidenceValidation.reasonCodes);
  }

  return {
    evidenceValidation,
    evaluate(request = {}) {
      const purposes = new Set(request.purposes ?? [request.purpose].filter(Boolean));
      const reasonCodes = [];
      let available = true;

      for (const policy of policies) {
        if (policy.blockedPurposes) {
          for (const blockedPurpose of policy.blockedPurposes) {
            if (purposes.has(blockedPurpose)) {
              available = false;
              reasonCodes.push(buildReason(blockedPurposeReasonCodes[blockedPurpose], {
                policyId: policy.id,
              }));
            }
          }
        }

        if (policy.allowedPurposes?.some((purpose) => purposes.has(purpose))) {
          reasonCodes.push(buildReason(policy.reasonCode, { policyId: policy.id }));
        }

        if (policy.requiresHumanStewardReview) {
          reasonCodes.push(buildReason("HUMAN_REVIEW_REQUIRED", { policyId: policy.id }));
        }
      }

      if (available) {
        reasonCodes.unshift(buildReason("RESEARCH_ONLY_BOUNDARY_CONFIRMED"));
      }

      return {
        available,
        boundary: "research_only_no_custody_no_payment_initiation_no_credential_collection",
        reasonCodes,
      };
    },
  };
};

export const startupEngine = createAvailabilityEngine();
export const startupEvidenceValidation = startupEngine.evidenceValidation;

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { scoreReviewedReplays, validateReviewedCase } from "../src/reviewed-replay.mjs";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("real_world_case_v1 protocol supports required review fields and metrics", async () => {
  const protocol = await readJson("data/real_world_case_v1.schema.json");

  assert.equal(protocol.schemaVersion, "real_world_case_v1");
  assert.equal(protocol.researchOnly, true);
  assert.equal(protocol.reviewedRealWorldCases, 0);
  assert.equal(protocol.gateStatus, "insufficient-reviewed-cases");

  for (const field of [
    "id",
    "evaluationTimestamp",
    "evidenceDates",
    "caseScope",
    "redactedNormalizedInput",
    "engine",
    "humanSteward",
    "humanReview",
    "disagreementCategory",
    "redactionStatus",
    "sameDayAgreementResult",
  ]) {
    assert.ok(protocol.requiredCaseFields.includes(field), field);
  }

  for (const metric of [
    "reviewed_case_count",
    "same_day_agreement_rate",
    "abstention_rate",
    "false_available_rate",
    "false_unavailable_rate",
    "insufficient_evidence_rate",
    "disagreement_categories",
    "breakdowns_by_scenario_provider_corridor",
  ]) {
    assert.ok(protocol.metrics.includes(metric), metric);
  }
});

test("real_world_case_v1 template is not an approved reviewed case", async () => {
  const template = await readJson("data/real_world_case_v1.template.json");
  const validation = validateReviewedCase(template);
  const report = scoreReviewedReplays({
    schemaVersion: "real_world_case_v1",
    policyVersion: "2026.08.26",
    cases: [template],
  });

  assert.equal(template.templateOnly, true);
  assert.equal(validation.ok, false);
  assert.equal(report.counts.accepted, 0);
  assert.equal(report.counts.rejected, 1);
  assert.equal(report.gate.status, "insufficient-reviewed-cases");
  assert.equal(report.gate.accuracy, null);
});

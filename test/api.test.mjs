import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import {
  buildStaticApiArtifacts,
  evaluateAvailability,
  getReplayRecord,
  listReplayRecords,
  responseMetadata,
  stableApplicationJson,
} from "../src/application.mjs";
import { handleApiRequest, maxRequestBodyBytes } from "../src/api.mjs";
import { scenarioMatrix } from "../src/replay.mjs";
import { canonicalJson } from "../src/stable-json.mjs";

const scenario = (id) => scenarioMatrix.scenarios.find((item) => item.id === id);
const scenarioInput = (item) => ({
  scenarioId: item.id,
  description: item.description,
  evaluationTimestamp: item.evaluationTimestamp,
  policyVersion: item.policyVersion,
  evidenceIds: item.evidenceIds,
  evidenceRequirements: item.evidenceRequirements,
  normalizedInput: item.normalizedInput,
});
const json = (response) => JSON.parse(response.body);

test("API metadata is deterministic, research-only, and non-live", () => {
  const first = handleApiRequest({ method: "GET", path: "/api/v1/meta" });
  const second = handleApiRequest({ method: "GET", path: "/api/v1/meta" });
  assert.equal(first.status, 200);
  assert.equal(first.body, second.body);
  assert.equal(first.headers["access-control-allow-origin"], undefined);
  assert.equal(json(first).meta.researchOnly, true);
  assert.equal(json(first).meta.nonLive, true);
});

test("API replay responses match shared application output", () => {
  assert.equal(handleApiRequest({ method: "GET", path: "/api/v1/replays" }).body, stableApplicationJson(listReplayRecords()));
  assert.equal(
    handleApiRequest({ method: "GET", path: "/api/v1/replays/scenario-010-preferred-rejected-valid-fallback" }).body,
    stableApplicationJson(getReplayRecord("scenario-010-preferred-rejected-valid-fallback")),
  );
});

test("evaluation endpoint is deterministic, non-persistent, and uses no fetch", () => {
  const input = scenarioInput(scenario("scenario-001-fully-available-same-day"));
  const body = JSON.stringify(input);
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = () => {
    called = true;
    throw new Error("network should not be used");
  };
  try {
    const before = handleApiRequest({ method: "GET", path: "/api/v1/replays" }).body;
    const first = handleApiRequest({ method: "POST", path: "/api/v1/evaluate", headers: { "content-type": "application/json" }, body });
    const second = handleApiRequest({ method: "POST", path: "/api/v1/evaluate", headers: { "content-type": "application/json" }, body });
    const after = handleApiRequest({ method: "GET", path: "/api/v1/replays" }).body;
    assert.equal(first.status, 200);
    assert.equal(first.body, second.body);
    assert.equal(first.body, canonicalJson({ meta: responseMetadata, replay: evaluateAvailability(input) }));
    assert.equal(before, after);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API returns structured 400, 404, 405, 413, and 415 errors", () => {
  const valid = scenarioInput(scenario("scenario-001-fully-available-same-day"));
  const malformed = handleApiRequest({ method: "POST", path: "/api/v1/evaluate", headers: { "content-type": "application/json" }, body: "{" });
  const missingTimestamp = handleApiRequest({ method: "POST", path: "/api/v1/evaluate", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...valid, evaluationTimestamp: undefined }) });
  const unknownRoute = handleApiRequest({
    method: "POST",
    path: "/api/v1/evaluate",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...valid, normalizedInput: { ...valid.normalizedInput, preferredRoute: { ...valid.normalizedInput.preferredRoute, id: "unknown-live-route" } } }),
  });
  const invalidEvidence = handleApiRequest({ method: "POST", path: "/api/v1/evaluate", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...valid, evidenceIds: ["unknown-evidence"] }) });
  const unknown = handleApiRequest({ method: "GET", path: "/api/v1/missing" });
  const method = handleApiRequest({ method: "POST", path: "/api/v1/meta" });
  const tooLarge = handleApiRequest({ method: "POST", path: "/api/v1/evaluate", headers: { "content-type": "application/json" }, body: "x".repeat(maxRequestBodyBytes + 1) });
  const media = handleApiRequest({ method: "POST", path: "/api/v1/evaluate", headers: { "content-type": "text/plain" }, body: "{}" });

  assert.equal(json(malformed).error.code, "MALFORMED_JSON");
  assert.equal(json(missingTimestamp).error.code, "MISSING_OR_INVALID_EVALUATION_TIMESTAMP");
  assert.equal(json(unknownRoute).error.code, "UNSUPPORTED_ROUTE");
  assert.equal(json(invalidEvidence).error.code, "INVALID_EVIDENCE_REFERENCE");
  assert.equal(unknown.status, 404);
  assert.equal(method.status, 405);
  assert.equal(method.headers.allow, "GET");
  assert.equal(tooLarge.status, 413);
  assert.equal(media.status, 415);
});

test("static demo artifacts match shared output and are byte-stable", async () => {
  const first = [...buildStaticApiArtifacts()].map(([path, value]) => [path, stableApplicationJson(value)]);
  const second = [...buildStaticApiArtifacts()].map(([path, value]) => [path, stableApplicationJson(value)]);
  assert.deepEqual(first, second);
  for (const [relativePath, value] of buildStaticApiArtifacts()) {
    assert.equal(await readFile(join("public/demo", relativePath), "utf8"), stableApplicationJson(value));
  }
});

test("static demo contains research-only and base-path-safe artifact loading", async () => {
  const html = (await readFile("public/demo/index.html", "utf8")).replace(/\s+/g, " ");
  const script = await readFile("public/demo/demo.js", "utf8");
  assert.match(html, /Research-only replay demo/);
  assert.match(html, /not live availability/);
  assert.match(script, /api\/v1\/replays\.json/);
});

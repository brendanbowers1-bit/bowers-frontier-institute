import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildErrorEvent,
  isErrorTrackerEnabled,
  readErrorTrackerDsn,
  reportError,
} from "../src/lib/errorTracker.js";
import { reportServerError } from "../server/errorTracker.mjs";
import { createRuntimeLog } from "../src/lib/runtimeLog.js";

test("error tracker is a no-op without an HTTPS DSN", async () => {
  assert.equal(readErrorTrackerDsn({}), "");
  assert.equal(isErrorTrackerEnabled(""), false);
  assert.equal(isErrorTrackerEnabled("not-a-url"), false);
  const result = await reportError("dashboard_render", new Error("boom"), {
    env: { VITE_ERROR_TRACKER_DSN: "" },
    fetchImpl: async () => {
      throw new Error("fetch should not run");
    },
  });
  assert.deepEqual(result, { sent: false, reason: "no_dsn" });
});

test("error tracker posts JSON when a DSN is set", async () => {
  const calls = [];
  const result = await reportError("dashboard_render", new Error("boom"), {
    dsn: "https://example.test/ingest",
    version: "1.0.0",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 204 };
    },
  });
  assert.equal(result.sent, true);
  assert.equal(calls[0].url, "https://example.test/ingest");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.event, "dashboard_render");
  assert.equal(body.message, "boom");
  assert.equal(body.researchOnly, true);
});

test("runtime log still writes locally when tracking is disabled", async () => {
  const lines = [];
  const reports = [];
  const log = createRuntimeLog({
    sink: { error: (line) => lines.push(line) },
    report: async (event, error) => {
      reports.push({ event, message: error.message });
      return { sent: false, reason: "no_dsn" };
    },
  });
  log.error("dashboard_render", new Error("boom"), { version: "1.0.0" });
  assert.equal(JSON.parse(lines[0]).message, "boom");
  await Promise.resolve();
  assert.equal(reports[0].event, "dashboard_render");
});

test("server tracker is a no-op without a DSN", async () => {
  const result = await reportServerError("credit_collar_scan", new Error("timeout"), {
    env: {},
    fetchImpl: async () => {
      throw new Error("fetch should not run");
    },
  });
  assert.deepEqual(result, { sent: false, reason: "no_dsn" });
});

test("buildErrorEvent never includes a stack", () => {
  const payload = buildErrorEvent("dashboard_render", new Error("boom"));
  assert.equal(payload.stack, undefined);
  assert.equal(payload.message, "boom");
});

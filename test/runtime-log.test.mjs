import assert from "node:assert/strict";
import { test } from "node:test";
import { createRuntimeLog } from "../src/lib/runtimeLog.js";
import { logServerError } from "../server/runtimeLog.mjs";
import { liveFeedUnavailableReason } from "../src/lib/liveFeedPolicy.js";

test("client runtime log emits structured JSON without stacks", () => {
  const lines = [];
  const log = createRuntimeLog({
    sink: { error: (line) => lines.push(line), log: (line) => lines.push(line) },
    service: "test-web",
  });
  log.error("dashboard_render", new Error("boom"), { version: "1.0.0" });
  assert.equal(lines.length, 1);
  const payload = JSON.parse(lines[0]);
  assert.equal(payload.level, "error");
  assert.equal(payload.event, "dashboard_render");
  assert.equal(payload.message, "boom");
  assert.equal(payload.researchOnly, true);
  assert.equal(payload.noTradeExecution, true);
  assert.equal(payload.version, "1.0.0");
  assert.equal(payload.stack, undefined);
});

test("server runtime log writes a single JSON error line", () => {
  const original = console.error;
  const lines = [];
  console.error = (line) => lines.push(line);
  try {
    logServerError("credit_collar_scan", new Error("upstream timeout"));
  } finally {
    console.error = original;
  }
  const payload = JSON.parse(lines[0]);
  assert.equal(payload.service, "credit-collar-api");
  assert.equal(payload.event, "credit_collar_scan");
  assert.equal(payload.message, "upstream timeout");
});

test("live feed is blocked on GitHub Pages subpaths", () => {
  assert.equal(liveFeedUnavailableReason("/"), null);
  assert.match(
    liveFeedUnavailableReason("/bowers-frontier-institute/"),
    /static subpath/,
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogs,
  DEFAULT_LOCALE,
  isResearchPath,
  missingMessageKeys,
  SUPPORTED_LOCALES,
  translate,
} from "../src/i18n/messages.js";

test("pt-PT catalog has every English string", () => {
  const { missingInTarget, extraInTarget, empty } = missingMessageKeys();
  assert.deepEqual(missingInTarget, []);
  assert.deepEqual(extraInTarget, []);
  assert.deepEqual(empty, []);
});

test("supported locales include English and European Portuguese", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  assert.deepEqual(SUPPORTED_LOCALES, ["en", "pt-PT"]);
  assert.ok(catalogs["pt-PT"].research.title.includes("Hipóteses"));
});

test("translate falls back when a key is missing", () => {
  assert.equal(translate(catalogs.en, "does.not.exist", "fallback"), "fallback");
  assert.equal(translate(catalogs.en, "nav.research"), "Research");
});

test("research path detection covers Pages and preview URLs", () => {
  assert.equal(isResearchPath("/research.html"), true);
  assert.equal(isResearchPath("/bowers-frontier-institute/research.html"), true);
  assert.equal(isResearchPath("/bowers-frontier-institute/research.html/"), true);
  assert.equal(isResearchPath("/"), false);
  assert.equal(isResearchPath("/bowers-frontier-institute/"), false);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  catalogs,
  DEFAULT_LOCALE,
  isFalsificationPath,
  isResearchPath,
  missingMessageKeys,
  SUPPORTED_LOCALES,
  translate,
} from "../src/i18n/messages.js";
import en from "../src/i18n/en.json" with { type: "json" };
import pt from "../src/i18n/pt-PT.json" with { type: "json" };

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

test("static trades page strings stay in sync with catalogs", () => {
  const page = JSON.parse(readFileSync("public/i18n/page-strings.json", "utf8"));
  assert.deepEqual(page.en.trades, en.trades);
  assert.deepEqual(page["pt-PT"].trades, pt.trades);
});

test("research path detection covers Pages and preview URLs", () => {
  assert.equal(isResearchPath("/research.html"), true);
  assert.equal(isResearchPath("/bowers-frontier-institute/research.html"), true);
  assert.equal(isResearchPath("/bowers-frontier-institute/research.html/"), true);
  assert.equal(isResearchPath("/"), false);
  assert.equal(isResearchPath("/bowers-frontier-institute/"), false);
});

test("falsification path detection covers Pages and preview URLs", () => {
  assert.equal(isFalsificationPath("/falsification.html"), true);
  assert.equal(isFalsificationPath("/bowers-frontier-institute/falsification.html"), true);
  assert.equal(isFalsificationPath("/bowers-frontier-institute/falsification.html/"), true);
  assert.equal(isFalsificationPath("/research.html"), false);
  assert.equal(isFalsificationPath("/"), false);
});

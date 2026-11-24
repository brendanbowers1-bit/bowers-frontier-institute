import en from "./en.json" with { type: "json" };
import ptPT from "./pt-PT.json" with { type: "json" };

export const SUPPORTED_LOCALES = ["en", "pt-PT"];
export const DEFAULT_LOCALE = "en";
export const catalogs = { en, "pt-PT": ptPT };
export const STORAGE_KEY = "bfi-locale";

export function flattenMessages(tree, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenMessages(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

export function lookup(tree, key) {
  return key.split(".").reduce((acc, part) => {
    if (acc && Object.hasOwn(acc, part)) {
      return acc[part];
    }
    return undefined;
  }, tree);
}

export function translate(messages, key, fallback) {
  const value = lookup(messages, key);
  if (typeof value === "string") {
    return value;
  }
  return fallback ?? key;
}

export function missingMessageKeys(base = en, target = ptPT) {
  const baseFlat = flattenMessages(base);
  const targetFlat = flattenMessages(target);
  const missingInTarget = Object.keys(baseFlat).filter((key) => !(key in targetFlat));
  const extraInTarget = Object.keys(targetFlat).filter((key) => !(key in baseFlat));
  const empty = Object.entries(targetFlat)
    .filter(([, value]) => value === "" || value == null)
    .map(([key]) => key);
  return { missingInTarget, extraInTarget, empty };
}

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(value);
}

export function isResearchPath(pathname = "") {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  return /(?:^|\/)research(?:\.html)?$/i.test(cleaned);
}

export function researchHref(baseUrl = "/") {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}research.html`;
}

export function dashboardHref(baseUrl = "/") {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function withLocale(href, locale) {
  if (!href || href.startsWith("#") || href.startsWith("http")) {
    return href;
  }
  const url = new URL(href, "https://example.invalid");
  if (isSupportedLocale(locale)) {
    url.searchParams.set("lang", locale);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

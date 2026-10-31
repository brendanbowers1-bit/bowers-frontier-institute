import { readFile } from "node:fs/promises";

const failures = [];
const fail = (message) => failures.push(message);

const [indexHtml, manifestText, serviceWorker, vercelConfig, netlifyConfig] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("public/manifest.webmanifest", "utf8"),
  readFile("public/service-worker.js", "utf8"),
  readFile("vercel.json", "utf8"),
  readFile("netlify.toml", "utf8"),
]);

const manifest = JSON.parse(manifestText);

if (!indexHtml.includes('rel="manifest"')) {
  fail("index.html must link to the PWA manifest.");
}

if (!indexHtml.includes("apple-mobile-web-app-capable")) {
  fail("index.html must include iOS standalone metadata.");
}

if (manifest.display !== "standalone") {
  fail("PWA manifest display must be standalone.");
}

if (!manifest.name || !manifest.short_name) {
  fail("PWA manifest must define name and short_name.");
}

if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
  fail("PWA manifest must define at least two icons.");
}

if (!serviceWorker.includes("self.addEventListener(\"fetch\"")) {
  fail("Service worker must handle fetch events.");
}

if (!serviceWorker.includes("requestUrl.pathname.startsWith(\"/api/\")")) {
  fail("Service worker must avoid caching live API requests.");
}

if (!vercelConfig.includes("\"outputDirectory\": \"dist\"")) {
  fail("Vercel config must publish dist.");
}

if (!netlifyConfig.includes("publish = \"dist\"")) {
  fail("Netlify config must publish dist.");
}

if (failures.length > 0) {
  console.error("PWA publish check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("PWA publish check passed.");

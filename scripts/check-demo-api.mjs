import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { buildStaticApiArtifacts, stableApplicationJson } from "../src/application.mjs";
import { handleApiRequest } from "../src/api.mjs";

const failures = [];
const fail = (message) => failures.push(message);

for (const [relativePath, value] of buildStaticApiArtifacts()) {
  const path = join("public/demo", relativePath);
  try {
    const current = await readFile(path, "utf8");
    if (current !== stableApplicationJson(value)) fail(`${path} does not match shared application output.`);
    if (/\/workspace|HOME=|TOKEN=|SECRET=|PASSWORD=|sk-|127\.0\.0\.1:\d+/.test(current)) {
      fail(`${path} appears to contain environment-specific or sensitive data.`);
    }
  } catch {
    fail(`${path} is missing.`);
  }
}

const meta = handleApiRequest({ method: "GET", path: "/api/v1/meta" });
if (meta.status !== 200) fail("GET /api/v1/meta did not return 200.");
if (meta.headers["access-control-allow-origin"] === "*") fail("API must not enable wildcard CORS.");
if (handleApiRequest({ method: "GET", path: "/api/v1/missing" }).status !== 404) {
  fail("Unknown API path did not return 404.");
}

const demoHtml = (await readFile("public/demo/index.html", "utf8")).replace(/\s+/g, " ");
for (const text of [
  "Research-only replay demo",
  "not live availability",
  "No custody, credentials, provider connections, or transactions are used.",
]) {
  if (!demoHtml.includes(text)) fail(`Demo HTML is missing required disclaimer text: ${text}`);
}

if (failures.length > 0) {
  console.error("Demo/API smoke check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Demo/API smoke check passed.");

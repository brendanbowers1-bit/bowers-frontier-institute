import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DIST = "dist";
const MAX_JS_BYTES = 1_250_000;
const MAX_CSS_BYTES = 250_000;
const MAX_CHUNK_BYTES = 850_000;

const failures = [];
const fail = (message) => failures.push(message);

const assetsDir = join(DIST, "assets");
const files = await readdir(assetsDir).catch(() => {
  fail("dist/assets is missing. Run a production build first.");
  return [];
});

let jsBytes = 0;
let cssBytes = 0;
let largestJs = { name: "", size: 0 };

for (const name of files) {
  const path = join(assetsDir, name);
  const size = (await stat(path)).size;
  if (name.endsWith(".js")) {
    jsBytes += size;
    if (size > largestJs.size) {
      largestJs = { name, size };
    }
  }
  if (name.endsWith(".css")) {
    cssBytes += size;
  }
}

if (jsBytes === 0) {
  fail("No JavaScript chunks found in dist/assets.");
}

if (jsBytes > MAX_JS_BYTES) {
  fail(`JS bundle ${jsBytes} bytes exceeds ${MAX_JS_BYTES} byte budget.`);
}

if (cssBytes > MAX_CSS_BYTES) {
  fail(`CSS bundle ${cssBytes} bytes exceeds ${MAX_CSS_BYTES} byte budget.`);
}

if (largestJs.size > MAX_CHUNK_BYTES) {
  fail(`Largest JS chunk ${largestJs.name} is ${largestJs.size} bytes (max ${MAX_CHUNK_BYTES}).`);
}

const html = await readFile(join(DIST, "index.html"), "utf8").catch(() => {
  fail("dist/index.html is missing.");
  return "";
});

if (html && !html.includes('id="root"')) {
  fail("Built HTML is missing the React root.");
}

const health = await readFile(join(DIST, "health.json"), "utf8").catch(() => {
  fail("dist/health.json is missing from the static artifact.");
  return "";
});

if (health) {
  const payload = JSON.parse(health);
  if (payload.status !== "ok" || payload.researchOnly !== true || payload.noTradeExecution !== true) {
    fail("health.json must declare ok status and research-only / no-trade-execution.");
  }
  if (payload.registry?.hypothesisCount !== 14 || payload.errorTrackerDsnConfigured !== false) {
    fail("health.json must publish DSN-free registry counts for 14 falsification rows.");
  }
}

if (failures.length > 0) {
  console.error("Bundle budget check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Bundle budget passed: js=${jsBytes} css=${cssBytes} largest=${largestJs.name}:${largestJs.size}`,
);

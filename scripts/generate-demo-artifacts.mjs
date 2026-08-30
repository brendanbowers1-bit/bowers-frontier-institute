import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { buildStaticApiArtifacts, stableApplicationJson } from "../src/application.mjs";

const outputRoot = "public/demo";
const checkOnly = process.argv.includes("--check");
const expectedArtifacts = [...buildStaticApiArtifacts()].map(([relativePath, value]) => [
  join(outputRoot, relativePath),
  stableApplicationJson(value),
]);
const missingOrChanged = [];

for (const [path, bytes] of expectedArtifacts) {
  if (checkOnly) {
    try {
      if ((await readFile(path, "utf8")) !== bytes) missingOrChanged.push(path);
    } catch {
      missingOrChanged.push(path);
    }
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
}

if (checkOnly && missingOrChanged.length > 0) {
  console.error("Demo artifacts are missing or not byte-identical:");
  for (const path of missingOrChanged) console.error(`- ${path}`);
  process.exit(1);
}

console.log(checkOnly ? "Demo artifacts match shared application output." : "Demo artifacts generated from shared application output.");

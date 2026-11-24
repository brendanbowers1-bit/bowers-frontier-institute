import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync("dist/index.html")) {
  console.error("Lighthouse CI requires dist/. Run npm run build first.");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["--no-install", "lhci", "autorun", "--config=lighthouserc.json"],
  { stdio: "inherit", env: { ...process.env, CHROME_FLAGS: "--no-sandbox --headless=new" } },
);

if (result.status !== 0) {
  process.exit(result.status === null ? 1 : result.status);
}

console.log("Lighthouse CI budgets passed.");

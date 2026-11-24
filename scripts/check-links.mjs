import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const hypothesesPath = join(root, "data/research/hypotheses.json");
const pagesHost = "https://brendanbowers1-bit.github.io/bowers-frontier-institute";
const skipHosts = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);
const failures = [];
const checked = new Set();

if (!(await exists(distDir))) {
  console.error("Broken-link check requires dist/. Run npm run build first.");
  process.exit(1);
}

const htmlFiles = await walkHtml(distDir);
const urls = new Set();

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const href of extractRefs(html)) {
    urls.add(href);
  }
}

const hypotheses = JSON.parse(await readFile(hypothesesPath, "utf8"));
for (const item of hypotheses.hypotheses ?? []) {
  if (item.prUrl) {
    urls.add(item.prUrl);
  }
}

for (const href of urls) {
  await checkHref(href);
}

if (failures.length > 0) {
  console.error("Broken-link check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Broken-link check passed (${urls.size} unique hrefs).`);

async function checkHref(href) {
  if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("data:")) {
    return;
  }
  if (href.startsWith("#")) {
    return;
  }

  const absolute = toAbsolute(href);
  if (checked.has(absolute)) {
    return;
  }
  checked.add(absolute);

  if (absolute.startsWith(pagesHost) || absolute.startsWith("/") || !absolute.startsWith("http")) {
    const localPath = toDistPath(absolute);
    if (!(await exists(localPath))) {
      failures.push(`${href} -> missing local file ${localPath}`);
    }
    return;
  }

  let host;
  try {
    host = new URL(absolute).host;
  } catch {
    failures.push(`${href} is not a valid URL`);
    return;
  }

  if (skipHosts.has(host)) {
    return;
  }

  const status = await fetchStatus(absolute);
  if (status === null) {
    failures.push(`${href} failed to fetch`);
    return;
  }
  if (status >= 400 && host === "github.com") {
    // Lab source PRs live in private repos; unauthenticated fetches 404.
    // Still require a well-formed GitHub path so garbage URLs fail.
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:pull|issues)\/\d+\/?$/.test(absolute)) {
      console.warn(`GitHub ${status} (private or unpublished): ${href}`);
      return;
    }
  }
  if (status >= 400) {
    failures.push(`${href} returned ${status}`);
  }
}

function toAbsolute(href) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href.split("#")[0];
  }
  if (href.startsWith("/bowers-frontier-institute/")) {
    return `${pagesHost}${href.slice("/bowers-frontier-institute".length)}`.replace(/\/$/, "") || pagesHost;
  }
  if (href.startsWith("/")) {
    return `${pagesHost}${href}`;
  }
  return href;
}

function toDistPath(absoluteOrPath) {
  let pathname = absoluteOrPath;
  if (absoluteOrPath.startsWith("http")) {
    pathname = new URL(absoluteOrPath).pathname;
  }
  if (pathname.startsWith("/bowers-frontier-institute/")) {
    pathname = pathname.slice("/bowers-frontier-institute".length);
  }
  if (pathname === "/" || pathname === "") {
    pathname = "/index.html";
  }
  if (pathname.endsWith("/")) {
    pathname = `${pathname}index.html`;
  }
  const normalized = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  return join(distDir, normalized.replace(/^\//, ""));
}

function extractRefs(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]+)"/gi)].map((match) => match[1]);
}

async function walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkHtml(full)));
    } else if (extname(entry.name) === ".html") {
      files.push(full);
    }
  }
  return files;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchStatus(url, attempt = 0) {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "bowers-frontier-institute-link-check" },
    });
    if (head.status === 405 || head.status === 501) {
      const get = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: { "user-agent": "bowers-frontier-institute-link-check" },
      });
      return get.status;
    }
    if (head.status === 429 && attempt < 2) {
      await delay(1_000 * (attempt + 1));
      return fetchStatus(url, attempt + 1);
    }
    return head.status;
  } catch {
    try {
      const get = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: { "user-agent": "bowers-frontier-institute-link-check" },
      });
      return get.status;
    } catch {
      return null;
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

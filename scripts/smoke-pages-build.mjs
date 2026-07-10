import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize } from "node:path";

const basePath = "/bowers-frontier-institute";
const distDir = new URL("../dist/", import.meta.url);
const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

const toDistPath = (urlPath) => {
  let path = urlPath;
  if (path === basePath || path === `${basePath}/`) {
    path = "/index.html";
  } else if (path.startsWith(`${basePath}/`)) {
    path = path.slice(basePath.length);
  }

  const normalized = normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");
  return new URL(`.${normalized}`, distDir);
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    const fileUrl = toDistPath(url.pathname);
    const body = await readFile(fileUrl);
    response.writeHead(200, {
      "content-type": contentTypes.get(extname(fileUrl.pathname)) ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

const listen = () =>
  new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });

const close = () =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

const fetchText = async (origin, path) => {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.text();
};

const port = await listen();
const origin = `http://127.0.0.1:${port}`;

try {
  const html = await fetchText(origin, `${basePath}/`);
  if (!html.includes('id="root"')) {
    throw new Error("Built HTML is missing the React root element.");
  }

  const assets = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((asset) => asset.startsWith(`${basePath}/`));

  if (assets.length === 0) {
    throw new Error("Built HTML does not reference any base-prefixed local assets.");
  }

  let combined = html;
  for (const asset of assets) {
    combined += await fetchText(origin, asset);
  }

  for (const requiredText of [
    "Bowers Frontier Institute",
    "Weekly trade discovery",
    "Weighted scorecard",
    "Recommendation tiers",
    "Hard no-trade gates",
    "BTC breakout continuation watchlist",
  ]) {
    if (!combined.includes(requiredText)) {
      throw new Error(`Built output is missing expected text: ${requiredText}`);
    }
  }

  console.log("GitHub Pages smoke test passed.");
} finally {
  await close();
}

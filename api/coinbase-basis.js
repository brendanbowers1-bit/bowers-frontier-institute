import { scanCoinbaseBasis } from "../server/coinbaseBasisScanner.mjs";

const ALLOWED_ORIGINS = new Set([
  "https://brendanbowers1-bit.github.io",
  "https://bowersfrontierinstitute.com",
]);

export default async function handler(request, response) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = await scanCoinbaseBasis({
      assets: request.query?.assets,
      maxCandidates: request.query?.max,
    });
    response.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=80");
    response.status(200).json(payload);
  } catch (error) {
    console.error("Unable to scan Coinbase basis", error);
    response.status(500).json({
      error: "Unable to scan Coinbase basis",
      message: "The Coinbase basis scanner is temporarily unavailable.",
    });
  }
}

function setCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
}

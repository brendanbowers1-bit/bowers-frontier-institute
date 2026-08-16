import { scanCreditCollars } from "../server/creditCollarScanner.mjs";

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
    const symbols = request.query?.symbols;
    const payload = await scanCreditCollars({ symbols });
    response.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    response.status(200).json(payload);
  } catch (error) {
    console.error("Unable to scan credit collars", error);
    response.status(500).json({
      error: "Unable to scan credit collars",
      message: "The research feed is temporarily unavailable.",
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

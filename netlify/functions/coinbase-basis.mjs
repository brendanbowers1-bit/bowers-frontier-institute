import { scanCoinbaseBasis } from "../../server/coinbaseBasisScanner.mjs";

const ALLOWED_ORIGINS = new Set([
  "https://brendanbowers1-bit.github.io",
  "https://bowersfrontierinstitute.com",
]);

const jsonHeaders = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=20, stale-while-revalidate=80",
  "Content-Type": "application/json",
};

export async function handler(event) {
  const headers = withCorsHeaders(event);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const payload = await scanCoinbaseBasis({
      assets: event.queryStringParameters?.assets,
      maxCandidates: event.queryStringParameters?.max,
    });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(payload),
    };
  } catch (error) {
    console.error("Unable to scan Coinbase basis", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Unable to scan Coinbase basis",
        message: "The Coinbase basis scanner is temporarily unavailable.",
      }),
    };
  }
}

function withCorsHeaders(event) {
  const origin = event.headers?.origin ?? event.headers?.Origin;
  if (!ALLOWED_ORIGINS.has(origin)) return jsonHeaders;

  return {
    ...jsonHeaders,
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

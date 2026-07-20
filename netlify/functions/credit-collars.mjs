import { scanCreditCollars } from "../../server/creditCollarScanner.mjs";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
  "Content-Type": "application/json",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: jsonHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const payload = await scanCreditCollars({ symbols: event.queryStringParameters?.symbols });
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({
        error: "Unable to scan credit collars",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}

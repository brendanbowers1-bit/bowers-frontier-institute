import { scanCreditCollars } from "../../server/creditCollarScanner.mjs";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
  "Content-Type": "application/json",
};

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: jsonHeaders,
    });
  }

  if (request.method !== "GET") {
    return Response.json(
      { error: "Method not allowed" },
      {
        status: 405,
        headers: jsonHeaders,
      },
    );
  }

  try {
    const url = new URL(request.url);
    const payload = await scanCreditCollars({ symbols: url.searchParams.get("symbols") });
    return Response.json(payload, {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Unable to scan credit collars",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: jsonHeaders,
      },
    );
  }
}

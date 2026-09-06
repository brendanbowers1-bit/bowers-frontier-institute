import { fetchCblLrdRates } from "../../server/lrdRateScanner.mjs";

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
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

  const payload = await fetchCblLrdRates();
  return Response.json(payload, {
    status: 200,
    headers: jsonHeaders,
  });
}

import { scanCreditCollars } from "../server/creditCollarScanner.mjs";

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Access-Control-Allow-Origin", "*");
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
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    response.status(200).json(payload);
  } catch (error) {
    response.status(500).json({
      error: "Unable to scan credit collars",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

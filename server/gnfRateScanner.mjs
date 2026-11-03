import { bcrgGnfFallback } from "../src/data/gnfRates.js";

const BCRG_FIXINGS_ENDPOINT =
  "https://www.bcrg-guinee.org/wp-json/wp/v2/cours_des_devises?per_page=1&orderby=date&order=desc";

export async function fetchBcrgGnfRates({ fetchImpl = fetch } = {}) {
  try {
    const latestFixing = await fetchLatestBcrgFixing(fetchImpl);
    const isFallbackSnapshot = latestFixing?.fixingDate !== bcrgGnfFallback.asOf;

    return {
      ...bcrgGnfFallback,
      asOf: latestFixing?.fixingDate ?? bcrgGnfFallback.asOf,
      sourceUrl: latestFixing?.pdfUrl ?? bcrgGnfFallback.sourceUrl,
      officialPostUrl: latestFixing?.postUrl ?? bcrgGnfFallback.officialPostUrl,
      degraded: isFallbackSnapshot,
      latestFixing,
      note: isFallbackSnapshot
        ? "BCRG publishes the latest table as a PDF. Returning the bundled official BCRG rate snapshot with the latest official PDF link."
        : "Rates are from the bundled official BCRG PDF snapshot.",
    };
  } catch (error) {
    return {
      ...bcrgGnfFallback,
      degraded: true,
      latestFixing: null,
      error: error instanceof Error ? error.message : "Unable to reach BCRG fixing feed",
      note: "Unable to refresh BCRG metadata. Returning the bundled official BCRG rate snapshot.",
    };
  }
}

async function fetchLatestBcrgFixing(fetchImpl) {
  const response = await fetchImpl(BCRG_FIXINGS_ENDPOINT, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BR3N-GNF-Research/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`BCRG returned ${response.status}`);
  }

  const posts = await response.json();
  const latest = Array.isArray(posts) ? posts[0] : null;
  if (!latest) {
    throw new Error("BCRG returned no fixing posts");
  }

  const title = stripHtml(latest.title?.rendered ?? "");
  const fixingDate = parseFixingDate(title) ?? parseFixingDate(latest.slug) ?? bcrgGnfFallback.asOf;

  return {
    title,
    fixingDate,
    postUrl: latest.link,
    pdfUrl: extractPdfUrl(latest.content?.rendered) ?? bcrgGnfFallback.sourceUrl,
    publishedAt: latest.date_gmt ?? latest.date,
  };
}

function extractPdfUrl(content = "") {
  const normalized = content
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"');
  const match = /https?:\/\/[^"'<>\\\s]+\.pdf/i.exec(normalized);
  return match?.[0] ?? null;
}

function parseFixingDate(value = "") {
  const match = /(\d{2})[-/](\d{2})[-/](\d{4})/.exec(value);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, "").trim();
}

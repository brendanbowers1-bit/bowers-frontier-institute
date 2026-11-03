import { cblLrdFallback } from "../src/data/lrdRates.js";

const CBL_RATES_ENDPOINT = "https://www.cbl.org.lr/index.php/research/buying-selling-rates";

export async function fetchCblLrdRates({ fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(CBL_RATES_ENDPOINT, {
      headers: {
        Accept: "text/html",
        "User-Agent": "BR3N-LRD-Research/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`CBL returned ${response.status}`);
    }

    const html = await response.text();
    const latest = parseLatestCblRate(html);
    if (!latest) {
      throw new Error("Unable to parse CBL buying/selling table");
    }

    return {
      ...cblLrdFallback,
      ...latest,
      degraded: false,
      rates: [
        {
          code: "USD",
          pair: "USD/LRD",
          rate: latest.mid,
          buying: latest.buying,
          selling: latest.selling,
        },
      ],
    };
  } catch (error) {
    return {
      ...cblLrdFallback,
      degraded: true,
      error: error instanceof Error ? error.message : "Unable to reach CBL rates page",
      note: "Unable to refresh CBL rates. Returning the bundled official CBL rate snapshot.",
      rates: [
        {
          code: "USD",
          pair: "USD/LRD",
          rate: cblLrdFallback.mid,
          buying: cblLrdFallback.buying,
          selling: cblLrdFallback.selling,
        },
      ],
    };
  }
}

function parseLatestCblRate(html) {
  const tableStart = html.indexOf("<table");
  const tableHtml = tableStart >= 0 ? html.slice(tableStart) : html;
  const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  for (const row of rows) {
    const datetime = /<time[^>]*datetime="([^"]+)"/i.exec(row)?.[1];
    const label = stripHtml(row.match(/<time[^>]*>[\s\S]*?<\/time>/i)?.[0] ?? "");
    const amounts = [...row.matchAll(/L\$\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*(?:US\$)?1\.00/gi)].map((match) =>
      Number(match[1]),
    );

    if (!datetime || amounts.length < 2 || amounts.some((amount) => !Number.isFinite(amount))) continue;

    const [buying, selling] = amounts;
    return {
      asOf: datetime.slice(0, 10),
      label,
      buying,
      selling,
      mid: roundRate((buying + selling) / 2),
    };
  }

  return null;
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function roundRate(value) {
  return Math.round(value * 10_000) / 10_000;
}

const GNF_RATES_ENDPOINT = "/api/gnf-rates";

export async function fetchBcrgGnfRateFeed({ signal } = {}) {
  const response = await fetch(GNF_RATES_ENDPOINT, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`BCRG GNF feed returned ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.rates)) {
    throw new Error("BCRG GNF feed did not return rates.");
  }

  return payload;
}

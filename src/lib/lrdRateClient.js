const LRD_RATES_ENDPOINT = "/api/lrd-rates";

export async function fetchCblLrdRateFeed({ signal } = {}) {
  const response = await fetch(LRD_RATES_ENDPOINT, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`CBL LRD feed returned ${response.status}`);
  }

  const payload = await response.json();
  if (typeof payload.mid !== "number") {
    throw new Error("CBL LRD feed did not return a mid rate.");
  }

  return payload;
}

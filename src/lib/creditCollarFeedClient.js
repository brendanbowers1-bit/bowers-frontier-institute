const LIVE_FEED_ENDPOINT = "/api/credit-collars";

export async function fetchLiveCreditCollars({ signal, symbols } = {}) {
  const params = new URLSearchParams();
  if (symbols?.length) {
    params.set("symbols", symbols.join(","));
  }

  const response = await fetch(`${LIVE_FEED_ENDPOINT}${params.size ? `?${params}` : ""}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Credit collar feed returned ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.candidates)) {
    throw new Error("Credit collar feed did not return candidates.");
  }

  return payload;
}

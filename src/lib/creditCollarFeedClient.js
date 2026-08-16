const LIVE_FEED_ENDPOINT = "/api/credit-collars";

export async function fetchLiveCreditCollars({ signal, symbols } = {}) {
  if (import.meta.env?.BASE_URL && import.meta.env.BASE_URL !== "/") {
    throw new Error("Live credit-collar feed is unavailable on static subpath deployments.");
  }

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

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Credit collar feed did not return JSON.");
  }

  const payload = await response.json();
  if (!Array.isArray(payload.candidates)) {
    throw new Error("Credit collar feed did not return candidates.");
  }

  return payload;
}

const LIVE_FEED_ENDPOINT = "/api/coinbase-basis";

export async function fetchLiveCoinbaseBasis({ assets, signal } = {}) {
  if (import.meta.env?.BASE_URL && import.meta.env.BASE_URL !== "/") {
    throw new Error("Live Coinbase basis feed is unavailable on static subpath deployments.");
  }

  const params = new URLSearchParams();
  if (assets?.length) {
    params.set("assets", assets.join(","));
  }

  const response = await fetch(`${LIVE_FEED_ENDPOINT}${params.size ? `?${params}` : ""}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Coinbase basis feed returned ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Coinbase basis feed did not return JSON.");
  }

  const payload = await response.json();
  if (!Array.isArray(payload.candidates)) {
    throw new Error("Coinbase basis feed did not return candidates.");
  }

  return payload;
}

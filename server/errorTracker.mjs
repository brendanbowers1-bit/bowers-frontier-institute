const HTTPS_DSN = /^https:\/\//i;

export function readServerErrorTrackerDsn(env = process.env) {
  return String(env.ERROR_TRACKER_DSN ?? env.VITE_ERROR_TRACKER_DSN ?? "").trim();
}

export function isServerErrorTrackerEnabled(dsn = readServerErrorTrackerDsn()) {
  return HTTPS_DSN.test(dsn);
}

export async function reportServerError(event, error, extra = {}) {
  const dsn = extra.dsn ?? readServerErrorTrackerDsn(extra.env);
  if (!isServerErrorTrackerEnabled(dsn)) {
    return { sent: false, reason: "no_dsn" };
  }

  const fetchImpl = extra.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    return { sent: false, reason: "no_fetch" };
  }

  try {
    const response = await fetchImpl(dsn, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        event,
        message: error instanceof Error ? error.message : String(error ?? event),
        service: extra.service ?? "credit-collar-api",
        researchOnly: true,
        noTradeExecution: true,
        ts: new Date().toISOString(),
      }),
      keepalive: true,
    });
    return { sent: response.ok, reason: response.ok ? "ok" : `http_${response.status}` };
  } catch {
    return { sent: false, reason: "transport_error" };
  }
}

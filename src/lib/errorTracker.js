const HTTPS_DSN = /^https:\/\//i;

export function readErrorTrackerDsn(env = import.meta.env) {
  return String(env?.VITE_ERROR_TRACKER_DSN ?? "").trim();
}

export function isErrorTrackerEnabled(dsn = readErrorTrackerDsn()) {
  return HTTPS_DSN.test(dsn);
}

export function buildErrorEvent(event, error, extra = {}) {
  return {
    event,
    message: error instanceof Error ? error.message : String(error ?? event),
    version: extra.version,
    researchOnly: true,
    noTradeExecution: true,
    ts: extra.ts ?? new Date().toISOString(),
  };
}

export async function reportError(event, error, extra = {}) {
  const dsn = extra.dsn ?? readErrorTrackerDsn(extra.env);
  if (!isErrorTrackerEnabled(dsn)) {
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
      body: JSON.stringify(buildErrorEvent(event, error, extra)),
      keepalive: true,
    });
    return { sent: response.ok, reason: response.ok ? "ok" : `http_${response.status}` };
  } catch {
    return { sent: false, reason: "transport_error" };
  }
}

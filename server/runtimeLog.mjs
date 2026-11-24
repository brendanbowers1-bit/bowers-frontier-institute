import { reportServerError } from "./errorTracker.mjs";

export function logServerError(event, error, extra = {}) {
  const payload = {
    level: "error",
    service: extra.service ?? "credit-collar-api",
    event,
    message: error instanceof Error ? error.message : String(error ?? event),
    researchOnly: true,
    noTradeExecution: true,
    ts: new Date().toISOString(),
  };
  console.error(JSON.stringify(payload));
  Promise.resolve(reportServerError(event, error, extra)).catch(() => {
    // Tracking is best-effort and must never change API responses.
  });
}

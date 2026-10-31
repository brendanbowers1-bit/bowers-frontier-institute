export const REQUIRED_EXECUTION_KEYS = ["COINBASE_API_KEY", "COINBASE_API_SECRET"];

export const PUBLIC_MARKET_PATH_ALLOWLIST = [
  /^\/api\/v1\/instruments\/?$/,
  /^\/api\/v1\/instruments\/[A-Z0-9._-]+\/quote\/?$/,
  /^\/api\/v1\/instruments\/[A-Z0-9._-]+\/funding\/?$/,
];

export const LIVE_ORDER_PATH_DENYLIST = [
  /\/orders?\b/i,
  /\/executions?\b/i,
  /\/fills?\b/i,
  /\/transfers?\b/i,
  /\/withdrawals?\b/i,
  /\/portfolios?\/[^/]+\/orders/i,
];

export const RESEARCH_ONLY_MODE = "research_only_no_execution";

export function hasExplicitExecutionKeys(env = globalThis.process?.env ?? {}) {
  return REQUIRED_EXECUTION_KEYS.every((key) => Boolean(String(env?.[key] ?? "").trim()));
}

export function assertPublicMarketRequest(url, init = {}) {
  const method = String(init.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    throw new Error(`Coinbase scanner allows GET market data only, received ${method}.`);
  }
  if (init.body != null) {
    throw new Error("Coinbase scanner rejects request bodies on market-data reads.");
  }

  const parsed = parseRequestUrl(url);
  if (LIVE_ORDER_PATH_DENYLIST.some((pattern) => pattern.test(parsed.pathname))) {
    throw new Error(`Live Coinbase order endpoint blocked: ${parsed.pathname}`);
  }
  if (!PUBLIC_MARKET_PATH_ALLOWLIST.some((pattern) => pattern.test(parsed.pathname))) {
    throw new Error(`Coinbase URL is outside the public market-data allowlist: ${parsed.pathname}`);
  }
}

export function buildPublicMarketHeaders() {
  return {
    Accept: "application/json",
    "User-Agent": "BR3N-Coinbase-Basis-Scanner/1.0",
  };
}

export async function fetchPublicMarketJson(url, fetchImpl, init = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required for Coinbase market-data reads.");
  }

  const requestInit = {
    ...init,
    method: "GET",
    headers: {
      ...buildPublicMarketHeaders(),
      ...(init.headers ?? {}),
    },
  };
  delete requestInit.body;
  assertPublicMarketRequest(url, requestInit);

  const response = await fetchImpl(url, requestInit);
  if (!response.ok) {
    throw new Error(`Coinbase request failed with ${response.status} for ${url}`);
  }
  return response.json();
}

export function refuseLiveOrder({
  env = globalThis.process?.env ?? {},
  fetchImpl,
  url = "https://api.international.coinbase.com/api/v1/orders",
} = {}) {
  void fetchImpl;
  assertOrderEndpointBlocked(url);

  if (!hasExplicitExecutionKeys(env)) {
    throw new Error("Live Coinbase orders are disabled: missing explicit API keys.");
  }

  throw new Error(
    `Live Coinbase order routing is disabled in this research scanner even when API keys are present. Blocked ${url}.`,
  );
}

export function createTradePlan(candidate) {
  return {
    generatedAt: new Date().toISOString(),
    mode: RESEARCH_ONLY_MODE,
    action: candidate.direction,
    asset: candidate.asset,
    spotProduct: candidate.spotProduct,
    perpProduct: candidate.perpProduct,
    spotPrice: candidate.spotPrice,
    perpPrice: candidate.perpPrice,
    basis: candidate.basis,
    expectedProfit: candidate.expectedProfit,
    reviewFlags: candidate.reviewFlags,
    warning:
      "This exported plan is not an order ticket. Validate venue access, depth, fees, funding, and approvals manually.",
  };
}

export function runTradeControl({
  action,
  candidate,
  env = globalThis.process?.env ?? {},
  fetchImpl,
} = {}) {
  const networkCalls = [];
  const trackedFetch = (...args) => {
    networkCalls.push(args[0]);
    if (typeof fetchImpl === "function") {
      return fetchImpl(...args);
    }
    throw new Error("Unexpected Coinbase network call from a research-only trade control.");
  };

  const label = `${candidate?.asset ?? "UNKNOWN"} ${candidate?.spotProduct ?? "?"}/${
    candidate?.perpProduct ?? "?"
  }`;

  if (action === "simulate") {
    return {
      executed: false,
      networkCalls,
      download: false,
      message: `Simulation staged for ${label}: long spot, short perp, expected profit ${formatPct(
        candidate?.expectedProfit,
      )}. No order was sent.`,
    };
  }

  if (action === "review") {
    return {
      executed: false,
      networkCalls,
      download: false,
      message: `Manual review ticket staged for ${label}. Treasury/risk approval remains required before any external action.`,
    };
  }

  if (action === "export") {
    return {
      executed: false,
      networkCalls,
      download: true,
      plan: createTradePlan(candidate),
      message: `Trade plan exported for ${label}. The export is local research data only, not an execution instruction.`,
    };
  }

  let reason = "Live order routing is intentionally disabled in this research dashboard.";
  try {
    refuseLiveOrder({ env, fetchImpl: trackedFetch });
  } catch (error) {
    reason = error instanceof Error ? error.message : String(error);
  }

  return {
    executed: false,
    networkCalls,
    download: false,
    message: `Auto-trade lock held for ${label}. ${reason}`,
  };
}

function assertOrderEndpointBlocked(url) {
  const parsed = parseRequestUrl(url);
  if (!LIVE_ORDER_PATH_DENYLIST.some((pattern) => pattern.test(parsed.pathname))) {
    throw new Error(`Expected an order endpoint to block, received ${parsed.pathname}`);
  }
}

function parseRequestUrl(url) {
  try {
    return new URL(url, "https://api.international.coinbase.com");
  } catch {
    throw new Error(`Invalid Coinbase request URL: ${url}`);
  }
}

function formatPct(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "n/a";
  return `${(parsed * 100).toFixed(3)}%`;
}

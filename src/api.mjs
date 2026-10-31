import { createServer } from "node:http";

import {
  ApplicationInputError,
  buildErrorEnvelope,
  evaluateAvailability,
  getMeta,
  getReplayRecord,
  getScenario,
  listReplayRecords,
  listScenarios,
  responseMetadata,
} from "./application.mjs";
import { canonicalJson } from "./stable-json.mjs";

export const maxRequestBodyBytes = 8192;

const jsonHeaders = Object.freeze({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-bfi-research-only": "true",
  "x-bfi-non-transactional": "true",
});

const routes = Object.freeze([
  { pattern: /^\/api\/v1\/meta$/, methods: ["GET"] },
  { pattern: /^\/api\/v1\/scenarios$/, methods: ["GET"] },
  { pattern: /^\/api\/v1\/scenarios\/([^/]+)$/, methods: ["GET"] },
  { pattern: /^\/api\/v1\/replays$/, methods: ["GET"] },
  { pattern: /^\/api\/v1\/replays\/([^/]+)$/, methods: ["GET"] },
  { pattern: /^\/api\/v1\/evaluate$/, methods: ["POST"] },
]);

const response = (status, payload, headers = {}) => ({
  status,
  headers: { ...jsonHeaders, ...headers },
  body: canonicalJson(payload),
});

const errorResponse = (status, code, message, details = {}, headers = {}) =>
  response(status, buildErrorEnvelope({ code, message, details }), headers);

const matchRoute = (pathname) => {
  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (match) return { route, params: match.slice(1).map((value) => decodeURIComponent(value)) };
  }
  return null;
};

const assertJsonContentType = (headers) => {
  const contentType = headers["content-type"] ?? headers["Content-Type"] ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new ApplicationInputError(415, "UNSUPPORTED_MEDIA_TYPE", "POST /api/v1/evaluate requires application/json.");
  }
};

const parseJsonBody = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    throw new ApplicationInputError(400, "MALFORMED_JSON", "Request body must be valid JSON.");
  }
};

export const handleApiRequest = ({ method = "GET", path = "/api/v1/meta", headers = {}, body = "" } = {}) => {
  const url = new URL(path, "http://127.0.0.1");
  const match = matchRoute(url.pathname);
  if (!match) {
    return errorResponse(404, "NOT_FOUND", "API route was not found.", { path: url.pathname });
  }
  if (!match.route.methods.includes(method)) {
    return errorResponse(405, "METHOD_NOT_ALLOWED", `${method} is not allowed for ${url.pathname}.`, { path: url.pathname }, { allow: match.route.methods.join(", ") });
  }

  try {
    if (method === "POST") {
      assertJsonContentType(headers);
      if (Buffer.byteLength(body, "utf8") > maxRequestBodyBytes) {
        return errorResponse(413, "PAYLOAD_TOO_LARGE", `Request body must be ${maxRequestBodyBytes} bytes or smaller.`);
      }
    }
    if (url.pathname === "/api/v1/meta") return response(200, getMeta());
    if (url.pathname === "/api/v1/scenarios") return response(200, listScenarios());
    if (url.pathname.startsWith("/api/v1/scenarios/")) return response(200, getScenario(match.params[0]));
    if (url.pathname === "/api/v1/replays") return response(200, listReplayRecords());
    if (url.pathname.startsWith("/api/v1/replays/")) return response(200, getReplayRecord(match.params[0]));
    if (url.pathname === "/api/v1/evaluate") {
      return response(200, { meta: responseMetadata, replay: evaluateAvailability(parseJsonBody(body)) });
    }
  } catch (error) {
    if (error instanceof ApplicationInputError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }
    throw error;
  }
  return errorResponse(404, "NOT_FOUND", "API route was not found.", { path: url.pathname });
};

const readRequestBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxRequestBodyBytes) {
        request.destroy();
        resolve({ tooLarge: true, body: "" });
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve({ tooLarge: false, body }));
    request.on("error", reject);
  });

export const createApiServer = () =>
  createServer(async (request, serverResponse) => {
    serverResponse.sendDate = false;
    const { tooLarge, body } = await readRequestBody(request);
    const apiResponse = tooLarge
      ? errorResponse(413, "PAYLOAD_TOO_LARGE", `Request body must be ${maxRequestBodyBytes} bytes or smaller.`)
      : handleApiRequest({ method: request.method, path: request.url, headers: request.headers, body });
    serverResponse.writeHead(apiResponse.status, apiResponse.headers);
    serverResponse.end(apiResponse.body);
  });

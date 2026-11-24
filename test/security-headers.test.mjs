import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const netlify = readFileSync("netlify.toml", "utf8");

const required = [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "Referrer-Policy",
  "Permissions-Policy",
];

test("Vercel and Netlify ship the same strict security headers", () => {
  const global = vercel.headers.find((entry) => entry.source === "/(.*)");
  assert.ok(global, "vercel.json must set headers for all routes");
  const keys = new Set(global.headers.map((header) => header.key));
  for (const name of required) {
    assert.ok(keys.has(name), `vercel.json missing ${name}`);
    assert.match(netlify, new RegExp(name));
  }
  const csp = global.headers.find((header) => header.key === "Content-Security-Policy").value;
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  const hsts = global.headers.find((header) => header.key === "Strict-Transport-Security").value;
  assert.equal(hsts, "max-age=31536000; includeSubDomains");
  const referrer = global.headers.find((header) => header.key === "Referrer-Policy").value;
  assert.equal(referrer, "strict-origin-when-cross-origin");
  const permissions = global.headers.find((header) => header.key === "Permissions-Policy").value;
  assert.match(permissions, /camera=\(\)/);
  assert.match(permissions, /usb=\(\)/);
});

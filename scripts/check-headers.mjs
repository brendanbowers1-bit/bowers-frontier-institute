import { readFile } from "node:fs/promises";

const required = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const [vercelText, netlifyText] = await Promise.all([
  readFile("vercel.json", "utf8"),
  readFile("netlify.toml", "utf8"),
]);
const vercel = JSON.parse(vercelText);
const failures = [];

const vercelHeaders = vercel.headers?.find((entry) => entry.source === "/(.*)")?.headers ?? [];
for (const [key, value] of Object.entries(required)) {
  const found = vercelHeaders.find((header) => header.key === key);
  if (!found) {
    failures.push(`vercel.json is missing ${key}.`);
  } else if (found.value !== value) {
    failures.push(`vercel.json ${key} does not match the strict header contract.`);
  }
  if (!netlifyText.includes(`${key} = "${value}"`) && !netlifyText.includes(`${key} = '${value}'`)) {
    failures.push(`netlify.toml is missing the strict ${key} value.`);
  }
}

if (!/Content-Security-Policy/.test(vercelText) || !/object-src 'none'/.test(vercelText)) {
  failures.push("CSP must include object-src 'none'.");
}

if (failures.length > 0) {
  console.error("Security header check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Security header check passed (CSP, HSTS, Referrer-Policy, Permissions-Policy).");

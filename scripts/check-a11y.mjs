import { readFile } from "node:fs/promises";

const failures = [];
const fail = (message) => failures.push(message);

const [indexHtml, dashboard, dashboardCss, indexCss] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("src/components/Br3nDashboard.jsx", "utf8"),
  readFile("src/components/Br3nDashboard.css", "utf8"),
  readFile("src/index.css", "utf8"),
]);

if (!indexHtml.includes('lang="en"')) {
  fail("index.html must set html lang.");
}

if (!indexHtml.includes('name="viewport"')) {
  fail("index.html must include a viewport meta tag.");
}

if (!indexHtml.includes("skip-link") || !indexHtml.includes('href="#overview"')) {
  fail("index.html must include a skip link to main content.");
}

if (!indexHtml.includes("display=swap")) {
  fail("Web fonts must request font-display swap.");
}

if (!dashboard.includes("aria-expanded")) {
  fail("Dashboard mobile navigation must expose aria-expanded.");
}

if (!dashboard.includes('id="overview"')) {
  fail("Dashboard must expose an overview landmark target for the skip link.");
}

if (!dashboard.includes("aria-live")) {
  fail("Dashboard must announce live-feed status.");
}

if (!dashboardCss.includes(":focus-visible") && !indexCss.includes(":focus-visible")) {
  fail("Visible keyboard focus styles are required.");
}

if (!indexCss.includes("prefers-reduced-motion")) {
  fail("Reduced-motion fallback is required.");
}

if (/autofocus/i.test(`${indexHtml}\n${dashboard}`)) {
  fail("Autofocus is not allowed on the production dashboard.");
}

if (failures.length > 0) {
  console.error("Accessibility check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Accessibility check passed.");

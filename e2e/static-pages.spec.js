import { expect, test } from "@playwright/test";

test("static health document is research-only", async ({ request }) => {
  const response = await request.get("/health.json");
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.status).toBe("ok");
  expect(payload.researchOnly).toBe(true);
  expect(payload.noTradeExecution).toBe(true);
  expect(payload.errorTrackerDsnConfigured).toBe(false);
  expect(payload.registry.hypothesisCount).toBe(14);
  expect(payload.registry.statusCounts.FALSIFIED).toBe(10);
  expect(payload.registry.route).toBe("/research/falsification.json");
});

test("static trades board is research-only", async ({ page }) => {
  await page.goto("/trades.html", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Credit Collar Trades/i);
  await expect(page.locator("body")).toContainText(/research/i);
});

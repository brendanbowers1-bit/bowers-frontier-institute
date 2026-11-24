import { expect, test } from "@playwright/test";

const sections = ["overview", "collars", "markets", "risk", "exposure", "signals"];

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Macro command/i })).toBeVisible({
    timeout: 15_000,
  });
});

test("dashboard home loads with research-only disclosure", async ({ page }) => {
  await expect(page).toHaveTitle(/Bowers Frontier Institute/i);
  await expect(page.getByText("No execution surface · research only")).toBeVisible();
  await expect(page.getByText("Mock data · no live feeds")).toBeVisible();
});

test("skip link targets the overview section", async ({ page }) => {
  const skip = page.locator(".skip-link");
  await expect(skip).toHaveAttribute("href", "#overview");
  await expect(page.locator("#overview")).toBeVisible();
});

test("main dashboard sections are reachable", async ({ page }) => {
  for (const id of sections) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
  }
});

test("period filters update pressed state", async ({ page }) => {
  const year = page.locator("#overview").getByRole("button", { name: "1Y", exact: true });
  await year.click();
  await expect(year).toHaveAttribute("aria-pressed", "true");
});

import { expect, test } from "@playwright/test";

test("research results page publishes falsified holdouts with source PRs", async ({ page }) => {
  await page.goto("/research.html?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Research results/i);
  await expect(page.getByRole("heading", { name: /Pre-registered hypotheses/i })).toBeVisible();
  await expect(page.getByText("−706 bps")).toBeVisible();
  await expect(page.getByText("−20.01 bps")).toBeVisible();
  await expect(page.getByText("every candidate is worse than random walk")).toBeVisible();
  await expect(page.getByRole("link", { name: "bfi-arbitrage#10" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/10",
  );
  await expect(page.getByRole("link", { name: "bfi-arbitrage#13" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/13",
  );
  await expect(page.getByRole("link", { name: "bfi-finance-lab#9" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/9",
  );
});

test("Portuguese locale translates dashboard and research chrome", async ({ page }) => {
  await page.goto("/?lang=pt-PT", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Comando macro/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Português" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");

  await page.goto("/research.html?lang=pt-PT", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Hipóteses pré-registadas/i })).toBeVisible();
  await expect(page.getByText("Falsificada").first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
});

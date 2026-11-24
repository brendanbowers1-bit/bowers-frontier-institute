import { expect, test } from "@playwright/test";

test("research results page publishes falsified holdouts with source PRs", async ({ page }) => {
  await page.goto("/research.html?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Research results/i);
  await expect(page.getByRole("heading", { name: /Pre-registered hypotheses/i })).toBeVisible();
  await expect(page.getByText("−111 bps", { exact: true })).toBeVisible();
  await expect(page.getByText("−706 bps")).toBeVisible();
  await expect(page.getByText("−20.01 bps")).toBeVisible();
  await expect(page.getByRole("heading", { name: /FX realized-vol/i })).toBeVisible();
  await expect(page.getByText("No robust winner")).toBeVisible();
  await expect(page.getByText("every candidate is worse than random walk")).toBeVisible();
  await expect(page.getByRole("link", { name: "bfi-arbitrage#16" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/16",
  );
  await expect(page.getByRole("link", { name: "bfi-arbitrage#10" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/10",
  );
  await expect(page.getByRole("link", { name: "bfi-arbitrage#13" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/13",
  );
  await expect(page.getByRole("link", { name: "bfi-finance-lab#10" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/10",
  );
  await expect(page.getByRole("link", { name: "bfi-finance-lab#9" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-finance-lab/pull/9",
  );

  const jsonLd = JSON.parse(
    await page.locator('script[type="application/ld+json"]').evaluate((el) => el.textContent),
  );
  const types = (jsonLd["@graph"] ?? []).map((node) => node["@type"]);
  expect(types).toContain("ResearchProject");
  expect(types).toContain("Dataset");
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

  await page.goto("/trades.html?lang=pt-PT", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Quadro de operações/i })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");

  await page.goto("/falsification.html?lang=pt-PT", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Registo de falsificação/i })).toBeVisible();
  await expect(page.getByText("Não se reivindica vantagem de negociação")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
});

test("falsification registry publishes FAIL-N, UNSCORED, PASS without a trading edge", async ({
  page,
  request,
}) => {
  const json = await request.get("/research/falsification.json");
  expect(json.ok()).toBeTruthy();
  const payload = await json.json();
  expect(payload.notATradingEdge).toBe(true);
  expect(payload.statusCounts.FALSIFIED).toBe(10);
  expect(payload.statusCounts["FAIL-N"]).toBe(1);
  expect(payload.statusCounts.UNSCORED).toBe(2);
  expect(payload.statusCounts.PASS).toBe(1);

  await page.goto("/falsification.html?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Falsification registry/i);
  await expect(page.getByRole("heading", { name: /Falsification registry/i })).toBeVisible();
  await expect(page.getByText("FAIL-N", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("UNSCORED", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("PASS", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("No trading edge is claimed")).toBeVisible();
  await expect(page.getByRole("link", { name: "bfi-arbitrage#16" })).toHaveAttribute(
    "href",
    "https://github.com/brendanbowers1-bit/bfi-arbitrage/pull/16",
  );
  await expect(page.getByText("Evidence advancement denied").first()).toBeVisible();

  const jsonLd = JSON.parse(
    await page.locator('script[type="application/ld+json"]').evaluate((el) => el.textContent),
  );
  const types = (jsonLd["@graph"] ?? []).map((node) => node["@type"]);
  expect(types).toContain("ResearchProject");
  expect(types).toContain("Dataset");
});

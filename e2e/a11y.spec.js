import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoAxeViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target),
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

test("dashboard meets WCAG 2.2 AA with zero axe violations", async ({ page }) => {
  await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Macro command/i })).toBeVisible({
    timeout: 15_000,
  });
  await expectNoAxeViolations(page);
});

test("falsification registry meets WCAG 2.2 AA with zero axe violations", async ({ page }) => {
  await page.goto("/falsification.html?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Falsification registry/i })).toBeVisible({
    timeout: 15_000,
  });
  await expectNoAxeViolations(page);
});

test("research results meet WCAG 2.2 AA with zero axe violations", async ({ page }) => {
  await page.goto("/research.html?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Pre-registered hypotheses/i })).toBeVisible({
    timeout: 15_000,
  });
  await expectNoAxeViolations(page);
});

test("keyboard-only skip link moves focus to overview", async ({ page }) => {
  await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Macro command/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#overview")).toBeFocused();
});

test("keyboard-only research page can reach a source PR", async ({ page }) => {
  await page.goto("/research.html?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Pre-registered hypotheses/i })).toBeVisible();

  let found = false;
  for (let i = 0; i < 24; i += 1) {
    await page.keyboard.press("Tab");
    const href = await page.evaluate(() => document.activeElement?.getAttribute?.("href") ?? "");
    if (href.includes("github.com/brendanbowers1-bit/bfi-arbitrage/pull/10")) {
      found = true;
      break;
    }
  }
  expect(found).toBeTruthy();
});

test("reduced motion skips the cinematic loader", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Macro command/i })).toBeVisible({
    timeout: 5_000,
  });
  await expect(page.locator(".br3n-loader")).toHaveCount(0);
  const scrollBehavior = await page.locator("html").evaluate((el) => getComputedStyle(el).scrollBehavior);
  expect(scrollBehavior).toBe("auto");
});

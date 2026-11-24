import { expect, test } from "@playwright/test";

const pages = [
  { name: "dashboard", path: "/?lang=en", heading: /Macro command/i },
  { name: "research", path: "/research.html?lang=en", heading: /Pre-registered hypotheses/i },
  { name: "trades", path: "/trades.html?lang=en", heading: /Trade board/i },
];

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

for (const pageSpec of pages) {
  for (const viewport of viewports) {
    test(`${pageSpec.name} ${viewport.name} visual snapshot`, async ({ page }) => {
      test.setTimeout(45_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(pageSpec.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: pageSpec.heading })).toBeVisible({
        timeout: 15_000,
      });
      await page.addStyleTag({
        content: `
          html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          html, body {
            background: #030304 !important;
            background-image: none !important;
          }
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            caret-color: transparent !important;
          }
        `,
      });
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      });
      if (pageSpec.name === "trades") {
        await page.waitForFunction(() => document.fonts.check('14px "IBM Plex Sans"'));
      }
      await page.waitForTimeout(400);
      const chartMasks = page.locator(".br3n-chart, .br3n-candles, .br3n-heatmap");
      await expect(page).toHaveScreenshot(`${pageSpec.name}-${viewport.name}.png`, {
        maxDiffPixelRatio: 0.08,
        animations: "disabled",
        scale: "css",
        mask: pageSpec.name === "dashboard" ? [chartMasks] : [],
      });
    });
  }
}

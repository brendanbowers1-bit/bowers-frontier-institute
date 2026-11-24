# BR3N Finance Dashboard

A premium, interactive finance dashboard for **BR3N**: black/white, institutional, minimalist, cinematic, and built as a luxury trading desk cockpit.

The current implementation uses modular mock data and is structured so live sources can later be connected through Bloomberg, Snowflake, yfinance, FRED, internal databases, or proprietary market-data services.

## Stack

- Vite + React
- Recharts
- Framer Motion
- Lucide icons
- Tailwind dependency is available; the dashboard uses a custom CSS visual system for tighter art direction

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Validate

```bash
npm test
npm run test:e2e
npm run lint
npm run check:a11y
npm run check:lighthouse
npm run check:pwa
npm run build
npm run quality:dashboard
npm run check:production
```

Honest production limits (host, research-only, no execution, DSN-gated error
tracker, Lighthouse budgets) are in `docs/PRODUCTION_LIMITS.md`.

Preview production build:

```bash
npm run preview
```

## Self-improve loop

Run all project gates once, including the root deploy checks, dashboard quality loop,
and the `currency-hedge-llm` test/demo/readiness loop:

```bash
ALL_PROJECT_SELF_IMPROVE_LOOPS=1 npm run self-improve:all
```

For unattended repetition, opt in explicitly and interrupt when finished:

```bash
ALL_PROJECT_CONTINUOUS=true npm run self-improve:all
```

Run the BR3N dashboard loop with a quality threshold:

```bash
DASHBOARD_QUALITY_TARGET=95 npm run self-improve:dashboard -- 2
```

Each loop runs lint, production build, and a dashboard quality score gate.

## Dashboard sections

1. Hero market overview with BR3N wordmark
2. Time-period toggles: `1D`, `5D`, `1M`, `3M`, `YTD`, `1Y`
3. Asset class filters: FX, equities, rates, crypto, commodities
4. Performance curve
5. EUR/USD OHLC candle tape
6. FX rates panel
7. Yield curve
8. Realized/implied volatility
9. P&L / performance curve
10. Currency exposure
11. Correlation heatmap
12. Risk dashboard with drawdown, VaR utilization, and hedge ratio

## Mock data architecture

Mock financial data is deliberately modular:

```text
src/data/fxRates.js
src/data/portfolioPerformance.js
src/data/currencyExposure.js
src/data/yieldCurve.js
src/data/volatility.js
src/data/correlations.js
```

Replace these modules or wrap them with adapters when connecting live APIs.

## Design direction

- Uses a custom inline SVG interpretation of the provided BR3N Macro Labs crest
- Adds a dark metallic ribbon-loop brand mark inspired by the supplied black sculptural logo reference
- Black background
- Soft white/gray type
- Glass and metal panels
- Thin borders
- Subtle glow
- Calm, silky transitions
- No visual clutter
- Dashboard-first responsive layout

## GitHub Pages production build

```bash
npm run build:pages
```

## Deployment checks

Pull requests and pushes to `main` run CI for:

- frontend lint, core-path tests, accessibility source check
- Playwright e2e on the dashboard and static pages
- Lighthouse CI performance and accessibility budgets
- production dependency audit (`npm audit --omit=dev`)
- local Vite production build and GitHub Pages Vite production build
- bundle budget and production-readiness score
- `currency-hedge-llm` Python package tests and deterministic demo smoke test

The GitHub Pages deploy workflow also runs frontend lint before uploading the
Pages artifact.

Deployment and trade-framework readiness gates:

```bash
npm run check:trade       # validates trade scorecard, tiers, gates, and example note
npm run check:collars     # validates positive-credit collar scoring and risk bounds
npm run check:pwa         # validates install metadata, service worker, and deploy configs
npm run check:a11y        # skip link, focus, reduced motion, no autofocus
npm run check:lighthouse  # Lighthouse CI performance and accessibility budgets
npm run test:e2e          # Playwright against vite preview
npm run check:production  # honest 100-point production-readiness rubric
npm run check:deploy      # ci + audits + tests + gates + dual builds + smoke + budget
```

## Publish

The dashboard is PWA-ready and can be deployed as a mobile web app:

- **Vercel**: uses `vercel.json`, publishes `dist`, and exposes `/api/credit-collars`.
- **Netlify**: uses `netlify.toml`, publishes `dist`, and routes `/api/credit-collars` to a function.
- **GitHub Pages**: use `GITHUB_PAGES=true npm run build`; live functions are not available, so the collar feed uses its static snapshot fallback.

See `docs/publishing.md` for the full launch checklist, PWA install notes, live-data guidance, and later iOS wrapper steps.

## Notes

- Current data is mock financial data only.
- No trade execution is included.
- The UI is structured for future live data integration.
- Weekly trade-discovery content from the site framework is represented in the dashboard Signals section as a research scorecard and no-trade gate workflow.

## Factuality

Do not add unverified partnerships, grants, awards, university affiliations, clinical results, or regulatory claims without evidence.

Trading references should describe research process, risk controls, candidate selection, and no-trade conditions. Do not present static site copy as personalized financial advice, automated execution instructions, or guaranteed performance.

## Note on dependencies

`package.json` includes dependencies from both the premium dashboard and the broader site framework. Keep dependency cleanup scoped to the active product surface when unused legacy components are removed.

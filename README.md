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
npm run lint
npm run build
npm run quality:dashboard
```

Preview production build:

```bash
npm run preview
```

## Self-improve loop

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
GITHUB_PAGES=true npm run build
```

## Notes

- Current data is mock financial data only.
- No trade execution is included.
- The UI is structured for future live data integration.

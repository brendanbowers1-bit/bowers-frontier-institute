# Production limits

This document is the honest operating envelope for the Bowers Frontier Institute
site and packages. It is not a claim that the product is a licensed trading
system.

## What is in production today

- Host: GitHub Pages at `/bowers-frontier-institute/`.
- App: static Vite/React PWA shell plus delayed/snapshot credit-collar research.
- HTTPS: provided by GitHub Pages.
- Deploy: GitHub Actions on `main` (`deploy.yml`), SHA-pinned official actions.
- Optional live feed: `/api/credit-collars` only on Vercel/Netlify-style hosts.
  GitHub Pages cannot run that function. The UI falls back to a static snapshot
  and does not call `/api` on the Pages subpath.

## What this is not

- Research only and no-trade: this deployment is not a broker, not an
  execution venue, and not personalized advice.
- Nothing in the UI or packages places orders, holds funds, or routes to a
  prime broker.
- Credit-collar rows are research candidates from delayed Cboe snapshots or
  bundled mock data. They are not guaranteed fills.
- `currency-hedge-llm` is decision-support research. Walk-forward scores are
  next-day return forecast metrics, not P&L.

## Data and licensing

- Dashboard market panels use modular mock data unless a live adapter is hosted.
- Delayed Cboe options are used only when a serverless function is deployed.
- ECB euro reference rates used in `data/research/` are public statistics.
  Attribution: Source: ECB statistics.
- EURUSD in that research file is the ECB USD reference. AUDUSD, GBPUSD,
  NZDUSD, USDCAD, USDCHF, and USDJPY are derived crosses, not official ECB USD
  quotes. Gaps are recorded, not interpolated.

## Security and configuration

- Runtime secrets must live in host environment variables, never in git.
- Tracked env files are placeholders only (`.env.example` and
  `currency-hedge-llm/.env.example`).
- Production npm audit (`npm audit --omit=dev`) is the runtime bar.
- `minimatch` is overridden to `11.0.9` so the shadcn CLI tree does not keep the
  glob DoS advisory. Do not `npm audit fix --force`; that would downgrade
  `shadcn` to 1.0.0.

## Observability

- Client and serverless errors emit one-line JSON logs (`level`, `event`,
  `message`, `researchOnly`).
- `health.json` is a static liveness document in the Pages artifact.
- Client and serverless errors also call an env-flagged error-tracker hook.
  With no `VITE_ERROR_TRACKER_DSN` / `ERROR_TRACKER_DSN`, the hook is a no-op.
  Set those to an HTTPS ingest URL when Brendan picks a provider. Never commit a
  live DSN. GitHub Pages still has no server process to scrape.

## Accessibility and performance

- Document language, skip link, visible focus, and reduced-motion fallback are
  required and gated.
- Bundle size is gated after `build` / `build:pages`.
- Google Fonts remain a third-party stylesheet. Self-hosting is a Brendan
  decision.
- Lighthouse CI asserts desktop performance (>= 0.70) and accessibility (>= 0.90)
  against the production `dist/` after `npm run build`.

## Research / paper-only code

FX history builder, walk-forward backtests, and hedge-memo generation are
paper/research. Direction accuracy near 50% and negative R² on the ECB
walk-forward mean the current baseline does not show usable daily directional
skill. Do not present those numbers as a production trading edge.

## Checks that must stay green

```bash
npm test
npm run test:e2e
npm run check:a11y
npm run check:lighthouse
npm run check:deploy
npm run check:production
```

Python package:

```bash
cd currency-hedge-llm
python -m pytest
bash scripts/run_demo.sh
```

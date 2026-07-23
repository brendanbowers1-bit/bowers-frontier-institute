# Bowers Frontier Institute

BFI is the master research institution and design-system source of truth for the
Bowers Frontier Institute ecosystem.

Mission line: **Discovering what humanity does not yet know.**

The active website is a sparse BFI homepage: luxury academic research, generous
whitespace, restrained typography, cinematic image treatment, research areas,
publications, open research, and a minimal footer. BR3N remains in the codebase
as a commercial AI/research dashboard surface under the broader BFI system.

## Stack

- Vite + React
- Recharts
- Framer Motion
- Lucide icons
- Tailwind dependency is available; active surfaces use custom CSS for tighter art direction

## Source of truth

```text
brand/design-system.md
brand/colors/tokens.css
brand/logos/
brand/typography/
cursor-rules/
docs/organization.md
docs/roadmap.md
companies/BR3N/
companies/SOLGLIA/
companies/OLTRE/
website/
assets/
design/
```

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
npm run check:pwa
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

## Active BFI homepage sections

1. Hero: BFI, The Bowers Frontier Institute, Exploring questions that reshape civilization.
2. Cinematic research image treatment
3. Research areas: Finance, AI, Medicine, Economics, Energy, Climate, Robotics
4. Publications
5. Open research: GitHub, papers, datasets, dashboards
6. Minimal footer

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

- BFI is luxury academic research, not corporate SaaS.
- Use black, white, warm white, stone, graphite, and a subtle gold accent.
- Use Cormorant Garamond for editorial display type and a restrained sans for interface text.
- Favor whitespace over decoration.
- Limit each screen to one primary action.
- Keep every product surface cohesive while giving BR3N, SOLGLIA, and OLTRE their own accents.
- Do not copy proprietary luxury or technology logos; use design principles only.

## GitHub Pages production build

```bash
GITHUB_PAGES=true npm run build
```

Deployment and trade-framework readiness gates:

```bash
npm run check:trade   # validates trade scorecard, tiers, gates, and example note
npm run check:collars # validates positive-credit collar scoring and risk bounds
npm run check:pwa     # validates install metadata, service worker, and deploy configs
npm run check:deploy  # audit + lint + trade check + builds + GitHub Pages smoke test
```

## Publish

The website is PWA-ready and can be deployed as a mobile web app:

- **Production domain**: `www.bowersfrontier.com` is purchased through Cloudflare and should be connected as the primary custom domain.
- **Cloudflare Pages**: recommended for the BFI static website; build with `npm run build` and publish `dist`.
- **Vercel**: uses `vercel.json`, publishes `dist`, and can expose `/api/credit-collars` for BR3N surfaces.
- **Netlify**: uses `netlify.toml`, publishes `dist`, and can route `/api/credit-collars` to a function.
- **GitHub Pages**: use `GITHUB_PAGES=true npm run build`.

See `docs/publishing.md` for the full launch checklist, PWA install notes, live-data guidance, and later iOS wrapper steps.

## Notes

- Current BR3N data is mock financial data only.
- No trade execution is included.
- BFI claims should remain factual and evidence-backed.
- The active homepage is intentionally sparse; add imagery and research pages through the documented website structure.

## Factuality

Do not add unverified partnerships, grants, awards, university affiliations, clinical results, or regulatory claims without evidence.

Trading references should describe research process, risk controls, candidate selection, and no-trade conditions. Do not present static site copy as personalized financial advice, automated execution instructions, or guaranteed performance.

## Note on dependencies

`package.json` includes dependencies from both the premium dashboard and the broader site framework. Keep dependency cleanup scoped to the active product surface when unused legacy components are removed.

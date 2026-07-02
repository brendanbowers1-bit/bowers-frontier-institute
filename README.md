# Bowers Frontier Institute

Simple one-page landing site for **Bowers Frontier Institute (BFI)**, with a finance-first AI lab emphasis.

**Tagline:** Frontier intelligence, built with discipline.

## Stack

- Vite + React
- Plain CSS (no runtime UI framework required for the page)

## Live site (GitHub Pages)

After deploy completes:

**https://brendanbowers1-bit.github.io/bowers-frontier-institute/**

Logo brand board:

**https://brendanbowers1-bit.github.io/bowers-frontier-institute/brand/logo/logo-concepts.html**

## Preview locally

```bash
cd /Volumes/BFI/Webpage/bowers-frontier-institute
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

```bash
npm run build    # production build → dist/
npm run preview  # preview production build
```

GitHub Pages production build:

```bash
GITHUB_PAGES=true npm run build
```

## BFI AI Lab data foundation

Core public dataset seeds for finance intelligence research are defined under `data/`.

```bash
npm run data:fetch
npm run data:normalize
npm run data:summarize
```

Or run both steps together:

```bash
npm run data:refresh
```

This pulls refreshable public seeds for crypto, ETF benchmarks, macro/rates, SEC fundamentals, options chains, futures snapshots, market structure, and headlines into `data/raw/YYYY-MM-DD/`, normalizes analysis-ready tables into `data/processed/YYYY-MM-DD/`, then generates compact summaries at `src/data/marketPulse.json` and `src/data/dataMoat.json`. Raw and processed data files are intentionally ignored by git; see `data/README.md` and `data/catalog.json`.

## BFI vertical operating system

Three-vertical repo/data setup guidance lives under `ops/lab-os/`:

- BFI AI Finance
- BFI T1D
- BR3N Creative

```bash
BFI_CODE_ROOT=/Volumes/BFI/01_ACTIVE_PROJECTS npm run labs:code:init -- --dry-run
BFI_DATA_ROOT=/Volumes/BFI/DATA npm run labs:storage:init -- --dry-run
BFI_CODE_ROOT=/Volumes/BFI/01_ACTIVE_PROJECTS BFI_DATA_ROOT=/Volumes/BFI/DATA npm run labs:init
BFI_DATA_ROOT=/Volumes/BFI/DATA npm run labs:storage:init
```

Use GitHub for vertical repos and `/Volumes/BFI/DATA/` for heavy data. Cloud object storage can be added later for backup and cloud-agent access.

## Sections

1. Hero — title, tagline, body, CTAs
2. What We Do — three capability cards
3. Market Pulse — first data dashboard from public/free sources
4. Verticals — BFI AI Finance, BFI T1D, BR3N Creative
5. Founder — Brendan Bowers
6. Contact — form UI + email placeholder (no backend)

## Factuality

Do not add unverified partnerships, grants, awards, university affiliations, clinical results, or regulatory claims without evidence.

## Note on dependencies

`package.json` may still list packages from an earlier build. The active page uses only React and plain CSS. Unused files under `src/components/` were left in place; remove them when you no longer need them.

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

## Sections

1. Hero — title, tagline, body, CTAs
2. What We Do — three capability cards
3. Labs — six laboratory names
4. Founder — Brendan Bowers
5. Contact — form UI + email placeholder (no backend)

## Factuality

Do not add unverified partnerships, grants, awards, university affiliations, clinical results, or regulatory claims without evidence.

## Note on dependencies

`package.json` may still list packages from an earlier build. The active page uses only React and plain CSS. Unused files under `src/components/` were left in place; remove them when you no longer need them.

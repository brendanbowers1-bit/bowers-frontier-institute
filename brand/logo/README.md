# Bowers Frontier Institute — Logo System

**Concept:** The Frontier Aperture  
**Status:** Identity foundation (logo only — not yet applied to the main website)

## Meaning

The mark is an abstract threshold: a portal into unknown territory. Geometry suggests:

- **Aperture** — central opening, framed inquiry  
- **Horizon** — disciplined observation line  
- **Path** — vertical centerline, methodical advance  
- **Portal** — lintel and posts without literal architecture  

It should read as trustworthy, precise, and institutionally serious — not as AI startup, crypto, or academic cosplay.

## Recommended mark

**Concept A — The Aperture** is the primary direction for BFI:

- Horizontal lockup for headers, PDFs, decks  
- Stacked lockup for cover pages and square formats  
- Circular monogram for favicon and compact UI  
- Icon-only for watermarks and subtle UI  

Concepts B (Horizon Monogram) and C (Research Gate) are alternates for comparison.

## Files

| File | Purpose |
|------|---------|
| `logo-concepts.html` | Brand board — all lockups, palette, type, usage |
| `logo-system.css` | Layout, color variables, typography, panels |
| `README.md` | This document |

## Preview locally

Open the brand board in a browser (no build step):

```bash
open /Volumes/BFI/Webpage/bowers-frontier-institute/brand/logo/logo-concepts.html
```

Or serve the folder:

```bash
cd /Volumes/BFI/Webpage/bowers-frontier-institute/brand/logo
python3 -m http.server 8080
# → http://localhost:8080/logo-concepts.html
```

## Color palette (CSS variables)

| Name | Hex | Use |
|------|-----|-----|
| Midnight Blue | `#0E1B2D` | Symbol, headings, formal accents |
| Charcoal | `#1A1A1A` | Body text, dark panels |
| Graphite | `#666666` | Secondary text, captions |
| Warm White | `#FAF8F4` | Brand board & document backgrounds |
| Silver Line | `#C8C8C8` | Rules, borders, dividers |

Logos must work in **pure black** and **reversed white** without color.

## Typography

| Role | Typeface |
|------|----------|
| Logo wordmark | Cormorant Garamond (uppercase, wide tracking) |
| Display | Source Serif 4 or Cormorant Garamond |
| Body / UI | IBM Plex Sans |
| Technical labels | IBM Plex Mono |

## Logo lockups

1. **Primary horizontal** — symbol left, wordmark right (`BOWERS FRONTIER INSTITUTE` or two-line variant)  
2. **Stacked** — symbol above; `BOWERS FRONTIER` + smaller `INSTITUTE`  
3. **BFI monogram** — circular enclosure + simplified aperture (favicon ≥16px)  
4. **Icon-only** — symbol without text  

## Clear space

Minimum clear space on all sides = **height of the symbol** (×1). Do not place type, rules, or imagery inside that zone.

## Exporting for production

All marks are **inline SVG** in `logo-concepts.html`. To use in the website or print:

1. Copy the relevant `<svg>` block from the recommended Concept A section  
2. Save as `public/logo-aperture.svg` (or similar) when integrating the landing page  
3. Keep `viewBox="0 0 48 48"` and scale with CSS `width` / `height`  
4. Use `currentColor` on strokes for theme flexibility  

## Do not

- Copy external logos, university seals, or agency work  
- Stretch, rotate, add shadows/glows/gradients, or recolor arbitrarily  
- Use on busy photos without a solid backing field  
- Claim third-party awards, affiliations, or partnerships in lockup contexts  

## Next step (when ready)

Apply Concept A SVG + wordmark styles to the Vite landing page header, favicon, and `index.html` — without changing unrelated project files.

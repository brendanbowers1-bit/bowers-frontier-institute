# Production readiness

Date: 2026-08-16

## Current deployment status

- Production site: https://brendanbowers1-bit.github.io/bowers-frontier-institute/
- Host: GitHub Pages
- Visibility: public
- HTTPS: enforced
- Deployment source: GitHub Actions workflow on `main`
- Current application mode on GitHub Pages: static PWA shell with snapshot
  fallback data for credit-collar research. GitHub Pages does not run the
  `/api/credit-collars` serverless endpoint.

## Changes made in this hardening pass

- Remediated all npm audit findings without `npm audit fix --force`.
- Moved `shadcn` from production `dependencies` to `devDependencies` because it
  is scaffolding/tooling and is not imported by the deployed React app.
- Tightened GitHub Actions token permissions:
  - Pages workflow is deny-by-default at the workflow level.
  - Pages build job has `contents: read`.
  - Pages deploy job has only `pages: write` and `id-token: write`.
  - Currency hedge CI has `contents: read`.
- Pinned official GitHub Actions to the commit SHAs currently referenced by
  their major-version tags.
- Narrowed GitHub Pages brand-board publishing to the public HTML/CSS files
  only, excluding internal reference briefs from the static Pages artifact.
- Added root `.env` ignore rules while preserving tracked `.env.example` files.
- Hardened optional Vercel/Netlify serverless credit-collar endpoints:
  - CORS now reflects only known production origins.
  - 500 responses return generic client-safe messages.
  - malformed ticker symbols are rejected before upstream fetches.
- Added baseline security headers to Vercel and Netlify configs.
- Added explicit in-product copy that the dashboard has no execution surface and
  is research-only.
- Added mobile navigation button accessibility metadata.
- Added canonical/social metadata, `robots.txt`, and standalone trade-board
  metadata.
- Added visible keyboard focus styles, skip-link support, pressed states on
  dashboard filters, live feed status announcements, and range value text.
- Added a visible live-feed fallback notice when the optional API is unavailable.
- Added a JSON content-type guard before parsing credit-collar feed responses.
- Added a simple React error boundary fallback.

## Vulnerabilities fixed

The initial audit reported 9 vulnerabilities: 1 low, 2 moderate, 6 high, and 0
critical. The remediated vulnerable transitive packages are:

- `@hono/node-server`: 1.19.14 -> 1.19.17
- `body-parser`: 2.2.2 -> 2.3.0
- `brace-expansion`: 5.0.6 -> 5.0.9
- `fast-uri`: 3.1.2 -> 3.1.5
- `hono`: 4.12.28 -> 4.13.2
- `ip-address`: 10.2.0 -> 10.5.0
- `js-yaml`: 4.2.0 -> 4.3.1
- `nanoid`: 3.3.12 -> 3.3.18
- `postcss`: 8.5.15 -> 8.5.26

Current audit status:

```bash
npm audit --audit-level=high
# found 0 vulnerabilities
```

## Vulnerabilities remaining

No npm audit vulnerabilities remain after remediation.

Some direct dependencies still have newer non-security releases available. They
are intentionally unresolved in this pass because they are not required for the
audit remediation and should be handled as a separate compatibility-focused
upgrade.

## Security hardening review

- Secrets: no committed real `.env` file was found. The only `.env` file is
  `currency-hedge-llm/.env.example`, which contains placeholder values.
- HTML injection: no `dangerouslySetInnerHTML`, `innerHTML`, or dynamic script
  injection usage was found in the React app.
- Client storage: `localStorage` is used for non-sensitive UI preferences only
  (watchlist, alert threshold, notification toggle, install prompt dismissal).
- External links: no unsafe `target="_blank"` external links were found in the
  deployed React app.
- Third-party scripts: no third-party script tags were found. The app loads
  Google Fonts stylesheets from `fonts.googleapis.com` and `fonts.gstatic.com`.
- Mixed content: no production `http://` resources were found in the app. Local
  HTTP URLs appear only in localhost documentation/config examples.
- GitHub Actions: permissions are least-privilege for the current workflows, and
  official actions are pinned to immutable commit SHAs.
- Research/internal artifacts: brand-board and example currency-hedge files are
  present in the repository. The Pages workflow copies only
  `brand/logo/logo-concepts.html` and `brand/logo/logo-system.css` into the
  static output.
- Optional serverless API: CORS, ticker normalization, and production error
  responses have been hardened for Vercel/Netlify deployments.
- Accessibility/readiness: primary dashboard controls now expose visible focus
  states and pressed states; the live-feed fallback is announced and visible.

## Tests executed

These checks are part of the hardening validation set:

```bash
npm run lint
npm run build
GITHUB_PAGES=true npm run build
npm run check:trade
npm run check:collars
npm run check:pwa
node scripts/smoke-pages-build.mjs
npm run quality:dashboard
npm audit --audit-level=high
node --input-type=module # content-type guard check
rm -rf node_modules
npm ci
npm run build
GITHUB_PAGES=true npm run build
npm audit --audit-level=high
```

Result: all checks passed. The GitHub Pages smoke test verified base-prefixed
asset paths under `/bowers-frontier-institute/`, and the PWA publish check
continued to pass after the workflow, dependency, and UI disclosure changes.
The built Pages HTML was also checked for canonical/social metadata and
base-prefixed asset paths, and the feed client rejects non-JSON API fallbacks
before parsing.

## Manual checks still requiring Brendan

- Review the live site visually on target mobile devices, especially iPhone
  Safari PWA install behavior.
- Provide PNG PWA icons sized for Apple touch, 192x192, and 512x512 install
  surfaces if app-store-quality install prompts are required.
- Decide whether to self-host current Google Font faces to reduce third-party
  stylesheet dependency.
- Confirm whether the two-file public brand-board output should remain
  published through GitHub Pages.
- Confirm whether internal brand-reference source files should remain tracked in
  this public repository or move to a private workspace.
- Confirm market-data licensing and production entitlement before presenting any
  live quotes as production-grade data.
- Rotate pinned GitHub Action SHAs during normal dependency maintenance, or
  enable an update tool that can open reviewed PRs for pinned actions.

## Recommended next engineering milestone

Perform a separate dependency modernization pass for non-security updates. Keep
that work compatibility-focused: update one group at a time, validate visual
behavior, and avoid mixing broad package upgrades with product changes.

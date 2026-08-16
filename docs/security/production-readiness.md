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
- Added explicit in-product copy that the dashboard has no execution surface and
  is research-only.
- Added mobile navigation button accessibility metadata.

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
  present in the repository. The Pages workflow intentionally copies
  `brand/logo` into the static output for the brand board.

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
rm -rf node_modules
npm ci
npm run build
GITHUB_PAGES=true npm run build
npm audit --audit-level=high
```

Result: all checks passed. The GitHub Pages smoke test verified base-prefixed
asset paths under `/bowers-frontier-institute/`, and the PWA publish check
continued to pass after the workflow, dependency, and UI disclosure changes.

## Manual checks still requiring Brendan

- Review the live site visually on target mobile devices, especially iPhone
  Safari PWA install behavior.
- Confirm whether the public brand-board output under `brand/logo` should remain
  published through GitHub Pages.
- Confirm market-data licensing and production entitlement before presenting any
  live quotes as production-grade data.
- Rotate pinned GitHub Action SHAs during normal dependency maintenance, or
  enable an update tool that can open reviewed PRs for pinned actions.

## Recommended next engineering milestone

Perform a separate dependency modernization pass for non-security updates. Keep
that work compatibility-focused: update one group at a time, validate visual
behavior, and avoid mixing broad package upgrades with product changes.

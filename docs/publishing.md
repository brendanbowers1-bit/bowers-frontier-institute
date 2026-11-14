# Publishing Bowers Frontier Institute

This site is publish-ready as a mobile web application and progressive web app (PWA) for
`https://www.bowersfrontier.com`. It also includes serverless live-feed adapters for hosts that support functions.

## Launch path

1. Run validation:

   ```bash
   npm run check:deploy
   ```

2. Deploy the website and connect `www.bowersfrontier.com` as the production domain.
3. Open it on iPhone Safari and use **Share -> Add to Home Screen**.
4. Connect a production market-data entitlement before presenting live quotes as production-grade data.
5. Wrap with Capacitor for App Store distribution after the web app experience is stable.

## Custom domain (Cloudflare)

`www.bowersfrontier.com` is registered on Cloudflare. HTTP 530 means the origin behind the proxy is down
or misconfigured. Point the domain at the live deployment:

### Option A — Cloudflare Pages (recommended with Cloudflare DNS)

1. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select `brendanbowers1-bit/bowers-frontier-institute`, production branch `main`.
3. Build command: `npm run build` · Output directory: `dist` · Root: `/`.
4. Pages → Custom domains → Add `www.bowersfrontier.com` (and optionally `bowersfrontier.com`).
5. Cloudflare will create/update the CNAME for `www` to `<project>.pages.dev`.
6. Apex (`bowersfrontier.com`): use a CNAME flatten to the same Pages hostname, or an HTTP redirect to `www`.

### Option B — GitHub Pages behind Cloudflare

1. Enable GitHub Pages from `main` / `/ (root)` or the Pages workflow artifact.
2. In Cloudflare DNS for `bowersfrontier.com`:
   - `www` → CNAME → `brendanbowers1-bit.github.io` (proxied or DNS-only).
   - Apex → redirect to `www`, or ALIAS/CNAME to the same Pages target if supported.
3. Add a repository `CNAME` file / Pages custom domain for `www.bowersfrontier.com` and complete HTTPS.
4. If you see 530, switch the record to DNS-only temporarily to confirm origin reachability, then re-enable proxy once SSL is valid.

### Apex redirect

Netlify/Vercel configs in this repo already 301 `bowersfrontier.com` → `www.bowersfrontier.com`.
On Cloudflare Pages, add a bulk redirect or Redirect Rule for the same apex → www behavior.

## Vercel

Vercel is the simplest host for the live-feed version because `/api/credit-collars` is included as a
serverless function.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- API route: `/api/credit-collars`

The included `vercel.json` sets the build output, PWA cache headers, and single-page-app fallback.

## Netlify

Netlify can also run the live-feed endpoint via `netlify/functions/credit-collars.mjs`.

- Build command: `npm run build`
- Publish directory: `dist`
- Function route: `/api/credit-collars`

The included `netlify.toml` maps `/api/credit-collars` to the Netlify function and keeps the app shell
working on deep links.

## GitHub Pages

GitHub Pages works for the static PWA shell and snapshot fallback feed.

```bash
GITHUB_PAGES=true npm run build
```

Publish the generated `dist` directory through the repository's Pages workflow. GitHub Pages does not
run serverless functions, so the UI will show the static delayed snapshot fallback unless a separate API
origin is configured.

## PWA checklist

- `public/manifest.webmanifest` defines the installable app metadata.
- `public/app-icon.svg` provides a maskable app icon.
- `public/service-worker.js` caches the shell and handles offline navigation fallback.
- `src/components/PwaInstallPrompt.jsx` gives mobile install instructions.
- `src/registerServiceWorker.js` registers the service worker only in production builds.

## Live market data

The browser calls `/api/credit-collars`. The server-side scanner fetches delayed Cboe option snapshots
and falls back to static data if a host does not provide the function route.

For a production trading research product, replace or supplement the delayed scanner with a licensed
market-data provider. Keep provider credentials on the server side only.

## iPhone App Store wrapper

Use the PWA as the product core first. When ready for TestFlight/App Store packaging:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Bowers Frontier" "com.bowersfrontier.app" --web-dir=dist
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Before submission, complete Apple privacy disclosures, screenshots, app icon assets, and any financial
data disclaimers required for your distribution model.

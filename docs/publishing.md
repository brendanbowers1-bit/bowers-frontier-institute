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

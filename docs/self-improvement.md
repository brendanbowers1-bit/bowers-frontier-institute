# Self-Improvement Loop

Use this loop for every BFI improvement pass:

1. Read `brand/design-system.md` and `cursor-rules/`.
2. Make one focused improvement to the active site, brand system, docs, or quality gates.
3. Run:

   ```bash
   npm run lint
   npm run check:pwa
   npm run build
   npm run quality:bfi
   npm run quality:dashboard
   ```

4. Commit and push the focused change.
5. Update the pull request summary when scope changes.

## Guardrails

- Do not add visual clutter just to show activity.
- Do not invent unverified institutional claims.
- Do not copy proprietary brand assets.
- Favor fewer, better improvements over broad churn.
- Keep BFI as the parent research institution and BR3N, SOLGLIA, and OLTRE as
  ecosystem surfaces.

# Evidence-backed replay matrix

The replay matrix in `data/scenarios.json` contains exactly 10 deterministic
research-only scenarios. Each scenario includes a stable ID, fixed evaluation
timestamp, policy version, evidence IDs, evidence scope requirements, normalized
input, and expected credited/tradable/externally transferable outcomes.

Run:

```bash
npm run replay:scenarios
```

Covered outcomes:

1. Fully available same-day route
2. Credited but not yet tradable
3. Tradable but externally transferable funds are held
4. Before-cutoff same-day route
5. After-cutoff next-business-day outcome
6. Provider or account-security hold
7. Expired evidence rejected fail-closed
8. Missing or unvalidated evidence rejected fail-closed
9. Conflicting or scope-mismatched evidence rejected
10. Preferred route rejected with a valid fallback

Decision records include schema/policy/registry versions, fixed timestamp,
input hash, evidence dates, status dimensions, ETA, cost, finality, hold risk,
reason codes, rejected routes, confidence, fallback, and validation failures.

Known gaps: all routes are synthetic fixtures; no live provider connectivity,
custody, payments, credentials, compliance decisions, or production availability
claims are included.

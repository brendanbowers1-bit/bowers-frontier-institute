# BFI Availability Demo/API

This milestone is research-only and read-only. It does not initiate payments,
transfers, trades, wallet actions, custody, provider connections, KYC/AML checks,
eligibility decisions, credential collection, persistence of API inputs, or live
availability checks. Outputs are dated-evidence replay records, not settlement
or payment guarantees.

## Architecture

- `src/application.mjs`: shared deterministic application layer.
- `src/api.mjs`: local JSON API adapter.
- `src/replay.mjs`: evidence-backed replay records.
- `src/reviewed-replay.mjs`: human-reviewed replay validation and scoring.
- `src/stable-json.mjs`: canonical JSON serialization.
- `public/demo/`: static GitHub Pages-compatible demo.

## Local API

Run:

```bash
npm run serve:demo
```

Endpoints:

- `GET /api/v1/meta`
- `GET /api/v1/scenarios`
- `GET /api/v1/scenarios/:scenarioId`
- `GET /api/v1/replays`
- `GET /api/v1/replays/:scenarioId`
- `POST /api/v1/evaluate`

`POST /api/v1/evaluate` is a pure calculation. It does not persist, mutate, log,
or send the request anywhere. Errors use a deterministic `{ meta, error }`
envelope and cover malformed JSON, wrong content type, oversized bodies,
unsupported fields, unknown routes, invalid evidence references, unknown paths,
and unsupported methods.

The public evaluation endpoint is intentionally restricted to exact supported
synthetic replay scenario inputs. It is a demo adapter, not an arbitrary
availability classifier.

## Static demo and artifacts

Generate artifacts:

```bash
npm run demo:artifacts
npm run demo:artifacts:check
```

Build and smoke test:

```bash
GITHUB_PAGES=true npm run build
node scripts/smoke-pages-build.mjs
```

The demo loads `public/demo/api/v1/*.json` with relative paths, so GitHub Pages
base paths work. It displays status dimensions, evaluation timestamp, schema and
policy versions, ETA, cost, finality, hold risk, confidence, reason codes,
evidence IDs/dates, rejected routes, fallback, validation failures, normalized
input, and raw JSON. Static JSON artifacts are not live provider APIs.

## Reviewed replay harness

Run:

```bash
npm run replay:reviewed
```

The versioned review protocol is `data/real_world_case_v1.schema.json`. It is a
research-only protocol for future independent evaluation; it does not contain or
fabricate real-world cases.
Use `docs/REAL_WORLD_REVIEW_INTAKE.md` and
`data/real_world_case_v1.template.json` for the first human-steward-reviewed
redacted cohort.

Reviewed cases must include stable case ID, fixed evaluation timestamp,
evidence as-of timestamp, evidence collection timestamp, redacted frozen
normalized input, explicit human-steward approval and reviewer ID, review
timestamp, case scope, evidence IDs/dates/freshness, engine classification and
rationale, engine evidence references, engine/policy/code version, deterministic
replay ID/hash, steward classification and rationale, disagreement category,
redaction status, same-day agreement result, freeze status, expected statuses,
expected same-day classification, expected ETA/reasons/hold
risk/confidence/rejected routes and fallback, safe provenance, schema version,
protocol version, and policy version.

Only approved, determinate, valid-evidence cases enter the accuracy denominator.
Invalid cases are reported separately. Current approved real-world reviewed
case count: `0`; the gate status is `insufficient-reviewed-cases`, and no
accuracy percentage is claimed.

Unlike the public demo endpoint, the offline reviewed replay harness may replay
a frozen real-world normalized input that is not identical to one of the 10
synthetic scenarios. Such cases must pass `real_world_case_v1` validation,
redaction, freeze, evidence, deterministic replay-hash, and human-steward gates
before they can affect metrics.

The same-day classification success gate is `>= 90%`. The result remains
preliminary until a human-approved minimum reviewed sample size is established.
The proposed research floor is 30 determinate cases; see
`docs/COHORT_1_STEWARD_APPROVAL.md`. No real-world cases are included yet.

Tracked future metrics include reviewed case count, same-day agreement rate,
abstention rate, false-available rate, false-unavailable rate,
insufficient-evidence rate, disagreement categories, and scenario/provider/
corridor breakdowns.

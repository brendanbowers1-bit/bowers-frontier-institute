# ChatGPT Handoff

## Branch status

- Branch: `cursor/availability-demo-7f81`
- Baseline in this checkout: `f4fcd33 feat(pwa): add install and social preview assets`
- Recreated the local-only BFI Availability Engine, replay matrix, read-only demo/API, and reviewed replay harness so it can be pushed and opened from other Cursor instances.

## Evidence and replay status

- Evidence registry: `data/evidence.json`
- Scenario matrix: `data/scenarios.json`
- Replay module: `src/replay.mjs`
- Scenario count: exactly 10
- Decision records are deterministic and immutable.

## Demo/API status

- Shared application layer: `src/application.mjs`
- API adapter: `src/api.mjs`
- Static demo: `public/demo/`
- Static artifacts: `public/demo/api/v1/*.json`
- Local API command: `npm run serve:demo`

## Reviewed replay status

- Reviewed registry: `data/reviewed-cases.json`
- Real-world review protocol: `data/real_world_case_v1.schema.json`
- Actual approved reviewed-real-world-case count: `0`
- Accuracy gate status: `insufficient-reviewed-cases`
- Same-day classification gate: `>= 90%`

## Boundaries preserved

- Research-only and read-only
- No custody
- No payment, transfer, trade, or wallet initiation
- No credentials or secrets
- No live provider connections
- No KYC/AML or eligibility decisions
- No payment or settlement guarantees
- No employer data or PII
- No unsupported production claims

## Next milestone

Human-steward review of redacted real-world cases and measurement against the
`>= 90%` same-day classification gate before any live capability API is added.

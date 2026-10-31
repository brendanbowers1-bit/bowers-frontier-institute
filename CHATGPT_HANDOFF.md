# ChatGPT Handoff

## Branch status

- Branch: `cursor/availability-demo-7f81`
- PR: `#19` (draft; not marked ready; not merged)
- Main merged in, including `#17` all-project self-improve workflow
- GitHub Actions `CI` workflow now runs `npm test` on pull requests
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
- Save this handoff to a local Mac Desktop after fetching the branch:
  `npm run save:chatgpt-handoff`

## Reviewed replay status

- Reviewed registry: `data/reviewed-cases.json`
- Real-world review protocol: `data/real_world_case_v1.schema.json`
- Real-world review intake template: `data/real_world_case_v1.template.json`
- Intake checklist: `docs/REAL_WORLD_REVIEW_INTAKE.md`
- Cohort 1 review plan: `docs/COHORT_1_REVIEW_PLAN.md`
- Steward approval checklist: `docs/COHORT_1_STEWARD_APPROVAL.md`
- Actual approved reviewed-real-world-case count: `0`
- Accuracy gate status: `insufficient-reviewed-cases`
- Same-day classification gate: `>= 90%`
- Proposed minimum sample size: 30 determinate cases, pending steward approval
- Public API evaluation remains exact-synthetic-scenario only; offline reviewed
  replay can evaluate frozen real-world normalized inputs after
  `real_world_case_v1` validation.

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

Do not add real-world cases until a steward approves the checklist in
`docs/COHORT_1_STEWARD_APPROVAL.md` (case format, redaction rules, and the
proposed 30/50 sample-size floors). Then measure against the `>= 90%`
same-day classification gate before any live capability API is added.

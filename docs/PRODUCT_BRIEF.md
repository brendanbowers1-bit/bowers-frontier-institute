# BFI Availability Engine Product Brief

## Purpose

The BFI Availability Engine is a deterministic research tool for checking
availability fixture outcomes against dated evidence. It is not a payments
product, compliance system, credential vault, brokerage workflow, or production
entitlement service.

## Non-negotiable boundary

- No payment initiation, order routing, custody, account control, or asset movement.
- No credential collection, secrets storage, customer records, employer data, or private operational data.
- No autonomous legal, regulatory, sanctions, KYC, AML, tax, employment, or other compliance decisions.
- No unsupported production-readiness claims.
- No fixture promotion to validated evidence without human-steward approval.

## Evidence, replay, demo/API, and review

Policies reference stable source IDs in `data/evidence.json`. Startup validation
requires every policy source to be present, validated, not expired, and as-of the
requested evaluation date. Synthetic fixtures are accepted only with explicit
human-steward approval metadata.

The 10-scenario replay matrix lives in `data/scenarios.json` and is replayed by
`src/replay.mjs`. The read-only API and static demo use `src/application.mjs` so
they do not duplicate policy/evidence logic.

The reviewed replay harness starts with zero approved real-world cases in
`data/reviewed-cases.json`, using the `real_world_case_v1` protocol in
`data/real_world_case_v1.schema.json`. Only explicitly human-approved,
redacted, valid-evidence cases can enter the same-day classification
denominator. Until a human-approved reviewed set exists, the harness reports
`insufficient-reviewed-cases` and does not claim accuracy or live capability
support. Cohort 1 real-world cases are deferred. The steward approval
checklist is `docs/COHORT_1_STEWARD_APPROVAL.md`.
